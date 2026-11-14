-- MANUAL REVIEW ONLY. Additive public profile; no production execution by the app.
-- Requires the reviewed owner RLS setup from 20261031_reviewed_offline_sync.sql.
-- Back up pg_policies and records and test in an isolated project first.
-- Prepend: SET titipandoa.security_review = 'approved';
begin;
do $$ begin
 if current_setting('titipandoa.security_review',true) is distinct from 'approved' then raise exception 'Explicit security review required'; end if;
 if to_regprocedure('public.titipandoa_is_owner()') is null then raise exception 'Install and verify owner authorization/RLS first'; end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='doas' and c.relrowsecurity) then raise exception 'doas must have reviewed RLS enabled'; end if;
end $$;
-- ONLY visitor-safe fields belong here. Do not put itinerary, flight numbers or notes here.
create table if not exists public.tumpangdoa_public_profile (
 id text primary key check(id='default'),
 display_name text not null default '' check(length(display_name)<=200),
 announcement text not null default '' check(length(announcement)<=2000),
 welcome_message text not null default '' check(length(welcome_message)<=2000),
 departure_date text not null default '' check(departure_date='' or departure_date ~ '^\d{4}-\d{2}-\d{2}$'),
 return_date text not null default '' check(return_date='' or return_date ~ '^\d{4}-\d{2}-\d{2}$'),
 accepting_submissions boolean not null default true,
 sharing_text text not null default '' check(length(sharing_text)<=2000)
);
alter table public.tumpangdoa_public_profile enable row level security;
create policy tumpangdoa_profile_read on public.tumpangdoa_public_profile for select to anon,authenticated using(true);
create policy tumpangdoa_profile_owner on public.tumpangdoa_public_profile for all to authenticated using(public.titipandoa_is_owner()) with check(public.titipandoa_is_owner());
grant select on public.tumpangdoa_public_profile to anon,authenticated;
grant insert,update,delete on public.tumpangdoa_public_profile to authenticated;
insert into public.tumpangdoa_public_profile(id,announcement,welcome_message,sharing_text)
values('default','Assalamualaikum! Insya-Allah saya akan menunaikan umrah tidak lama lagi. Kalau ada yang nak tumpang doa, boleh tinggalkan di sini. Insya-Allah saya cuba bacakan satu persatu di Tanah Suci. 🤍','Tinggalkan di sini, saya bacakan di Tanah Suci.','Assalamualaikum! Insya-Allah saya akan menunaikan umrah tidak lama lagi. Kalau ada yang nak tumpang doa, boleh tinggalkan di sini. Insya-Allah saya cuba bacakan satu persatu di Tanah Suci. 🤍') on conflict(id) do nothing;
-- Invoker trigger reads only the public profile. Anonymous submissions remain insert-only.
-- Does not change or delete existing prayers/policies. A closed inbox also blocks old/offline clients.
create or replace function public.tumpangdoa_validate_submission() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.tumpangdoa_public_profile where id='default' and accepting_submissions=false) then raise exception 'Kiriman doa baharu sedang ditutup.' using errcode='42501'; end if;
 if new.message is null or length(trim(new.message)) not between 1 and 10000 or new.sender_name is null or length(trim(new.sender_name)) not between 1 and 200 then raise exception 'Invalid prayer input'; end if;
 return new;
end $$;
create trigger tumpangdoa_validate_submission before insert on public.doas for each row execute function public.tumpangdoa_validate_submission();
commit;
-- Rollback after review: drop trigger tumpangdoa_validate_submission on public.doas;
-- drop function public.tumpangdoa_validate_submission();
-- Retain the profile table/data for recovery, or back it up before explicitly dropping it.
-- Anonymous direct REST SELECT of doas/checklist/itinerary/expenses/app_settings MUST return no rows.
-- This script does not audit or replace legacy permissive policies: verify them separately.
