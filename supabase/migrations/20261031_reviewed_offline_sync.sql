-- MANUAL REVIEW ONLY. Back up existing policies first. No production execution by setup.
-- Prepend SET titipandoa.security_review = 'approved'; to this entire script only after review.
begin;
do $$ begin
 if current_setting('titipandoa.security_review',true) is distinct from 'approved' then
  raise exception 'Review the security impact and policy backup instructions before approving this migration';
 end if;
 if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='doas' and column_name='id' and data_type in ('uuid','text','character varying')) then
  raise exception 'doas.id must support client UUIDs. No ID type conversion is performed automatically';
 end if;
end $$;
create or replace function public.titipandoa_is_owner() returns boolean language sql stable security invoker set search_path='' as $$ select coalesce(auth.jwt()->'app_metadata'->>'titipandoa_role' = 'owner',false) $$;
revoke all on function public.titipandoa_is_owner() from public;
grant execute on function public.titipandoa_is_owner() to authenticated;
-- Replace permissive legacy policies only after explicit review; preserve all records.
do $$ declare r record; t text; begin
 foreach t in array array['doas','checklist','itinerary','expenses','app_settings'] loop
  if to_regclass('public.'||t) is null then raise exception 'Missing existing table %; inspect schema first',t; end if;
  execute format('alter table public.%I enable row level security',t);
  for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',r.policyname,t);
  end loop;
  execute format('create policy titipandoa_owner on public.%I for all to authenticated using (public.titipandoa_is_owner()) with check (public.titipandoa_is_owner())',t);
 end loop;
end $$;
create policy titipandoa_public_submission on public.doas for insert to anon with check (
 length(trim(sender_name)) between 1 and 200 and length(trim(message)) between 1 and 10000
 and coalesce(amin_count,0)=0 and coalesce(is_read,false)=false and coalesce(is_bookmarked,false)=false
);
grant insert on public.doas to anon;
grant select,insert,update,delete on public.doas,public.checklist,public.itinerary,public.expenses,public.app_settings to authenticated;
alter table public.checklist add column if not exists updated_at timestamptz not null default now();
alter table public.itinerary add column if not exists updated_at timestamptz not null default now();
alter table public.itinerary add column if not exists notes text;
create or replace function public.titipandoa_touch_version() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
drop trigger if exists titipandoa_version on public.checklist;
create trigger titipandoa_version before update on public.checklist for each row execute function public.titipandoa_touch_version();
drop trigger if exists titipandoa_version on public.itinerary;
create trigger titipandoa_version before update on public.itinerary for each row execute function public.titipandoa_touch_version();
create table if not exists public.titipandoa_sync_receipts (
 user_id uuid not null references auth.users(id), operation_id uuid not null,
 request jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
 primary key(user_id,operation_id)
);
alter table public.titipandoa_sync_receipts enable row level security;
drop policy if exists titipandoa_own_receipts on public.titipandoa_sync_receipts;
create policy titipandoa_own_receipts on public.titipandoa_sync_receipts for all to authenticated using (auth.uid()=user_id and public.titipandoa_is_owner()) with check (auth.uid()=user_id and public.titipandoa_is_owner());
grant select,insert on public.titipandoa_sync_receipts to authenticated;
create or replace function public.titipandoa_apply_offline_operation(
 p_operation_id uuid,p_entity text,p_record_id text,p_expected_updated_at timestamptz,p_changes jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare old_receipt public.titipandoa_sync_receipts; request_data jsonb; result_data jsonb; current_row jsonb; changed_row jsonb;
begin
 if auth.uid() is null or not public.titipandoa_is_owner() then raise insufficient_privilege using message='Owner authorization required'; end if;
 if p_operation_id is null or p_expected_updated_at is null or p_changes is null or jsonb_typeof(p_changes) is distinct from 'object' then raise exception 'Invalid offline operation'; end if;
 request_data=jsonb_build_object('entity',p_entity,'record_id',p_record_id,'expected_updated_at',p_expected_updated_at,'changes',p_changes);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_operation_id::text,0));
 select * into old_receipt from public.titipandoa_sync_receipts where user_id=auth.uid() and operation_id=p_operation_id;
 if found then
  if old_receipt.request<>request_data then raise exception 'Operation ID cannot be reused with another payload'; end if;
  return old_receipt.result;
 end if;
 if p_entity='checklist' then
  if not (p_changes ? 'completed') or p_changes - 'completed' <> '{}'::jsonb or jsonb_typeof(p_changes->'completed')<>'boolean' then raise exception 'Only checklist completion is supported'; end if;
  select to_jsonb(c) into current_row from public.checklist c where c.id::text=p_record_id for update;
  if current_row is null then raise exception 'Checklist record missing or inaccessible'; end if;
  if (current_row->>'updated_at')::timestamptz is distinct from p_expected_updated_at then return jsonb_build_object('status','conflict','row',current_row); end if;
  update public.checklist c set completed=(p_changes->>'completed')::boolean where c.id::text=p_record_id returning to_jsonb(c) into changed_row;
 elsif p_entity='itinerary' then
  if not (p_changes ? 'notes') or p_changes - 'notes' <> '{}'::jsonb or jsonb_typeof(p_changes->'notes')<>'string' or length(p_changes->>'notes')>10000 then raise exception 'Only itinerary notes are supported'; end if;
  select to_jsonb(i) into current_row from public.itinerary i where i.id::text=p_record_id for update;
  if current_row is null then raise exception 'Itinerary record missing or inaccessible'; end if;
  if (current_row->>'updated_at')::timestamptz is distinct from p_expected_updated_at then return jsonb_build_object('status','conflict','row',current_row); end if;
  update public.itinerary i set notes=p_changes->>'notes' where i.id::text=p_record_id returning to_jsonb(i) into changed_row;
 else raise exception 'Unsupported offline entity'; end if;
 result_data=jsonb_build_object('status','applied','row',changed_row);
 insert into public.titipandoa_sync_receipts(user_id,operation_id,request,result) values(auth.uid(),p_operation_id,request_data,result_data);
 return result_data;
end $$;
revoke all on function public.titipandoa_apply_offline_operation(uuid,text,text,timestamptz,jsonb) from public;
grant execute on function public.titipandoa_apply_offline_operation(uuid,text,text,timestamptz,jsonb) to authenticated;
commit;
