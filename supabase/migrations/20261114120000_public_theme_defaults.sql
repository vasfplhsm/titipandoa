-- MANUAL REVIEW ONLY. Additive public appearance settings; no automatic execution.
-- Requires 20261114_tumpangdoa_public_profile.sql and its reviewed owner RLS policies.
-- Back up schema/policies first, test with anon/non-owner/owner credentials in an
-- isolated project, then explicitly prepend:
-- SET titipandoa.security_review = 'approved';
begin;
do $$ begin
 if current_setting('titipandoa.security_review',true) is distinct from 'approved' then
  raise exception 'Explicit security review required';
 end if;
 if to_regclass('public.tumpangdoa_public_profile') is null then
  raise exception 'Install and verify the public profile and owner RLS first';
 end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname='tumpangdoa_public_profile' and c.relrowsecurity) then
  raise exception 'Public profile RLS must be enabled and independently reviewed';
 end if;
end $$;
alter table public.tumpangdoa_public_profile
 add column if not exists public_theme text not null default 'rosewood'
 check (public_theme in ('rosewood','sage','coastal'));
alter table public.tumpangdoa_public_profile
 add column if not exists public_appearance text not null default 'light'
 check (public_appearance in ('light','dark','system'));
-- Existing SELECT/owner-only UPDATE policies apply to these visitor-safe columns.
-- No grants or RLS policies are weakened or replaced. No prayers, statuses,
-- planning records, announcements, IDs or browser data are changed.
commit;
-- Review verification: anon and authenticated non-owner SELECT may read only the
-- visitor-safe profile; their UPDATE of either field must fail. A verified owner
-- UPDATE ... RETURNING must return the selected valid values. Invalid IDs/modes
-- must be rejected by CHECK constraints. Re-test private table SELECT denial.
-- Rollback: first roll back the frontend and export these two preference values.
-- Then, ONLY if necessary and after review:
-- alter table public.tumpangdoa_public_profile drop column public_theme;
-- alter table public.tumpangdoa_public_profile drop column public_appearance;
-- Keeping the additive columns is compatible with the previous frontend.
