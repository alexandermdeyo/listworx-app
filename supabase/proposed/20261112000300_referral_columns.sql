-- ============================================================================
-- PROPOSED — NOT APPLIED. Launch blocker found in browser testing (2026-11-12),
-- plus the owner's referral-privacy rule (2026-11-12):
--
--   "Contractors need to see that they had a referral … but no information
--    about the job or the requestor should be given to the contractor. The
--    contractor only gets to see a tally of how many referrals they have gotten,
--    by week, month, quarter or year."
--
-- 1. Columns the admin screens already read/write but production lacks
--    (the admin Job Requests list failed; resend-email and mark-contacted
--    could not save): slot_position, email_sent_at, requester_contacted,
--    requester_contacted_at. Additive; existing rows and slot_number are kept.
-- 2. Contractors can no longer read or change referral rows (which link to the
--    job request and carry admin notes). Admins keep full access; the server
--    (service role) is unaffected.
-- 3. my_referral_tally(): counts only — this week, month, quarter, year and all
--    time — for the signed-in contractor. Periods follow Central time
--    (weeks start Monday).
-- 4. One referral per contractor per request (owner rule: count each unique
--    contractor/request combination once).
-- 5. The same privacy for the two tables that link contractors to requests:
--    job_assignments (contractors could read/update their own rows) and
--    job_request_categories (anyone could read it). Admin and server only;
--    the app reads both only from admin screens and server routes.
-- Production had 0 referrals on 2026-11-10. Safe to re-run.
-- ============================================================================
begin;

-- 1. Columns
alter table public.referrals
  add column if not exists slot_position          integer,
  add column if not exists email_sent_at          timestamptz,
  add column if not exists requester_contacted    boolean not null default false,
  add column if not exists requester_contacted_at timestamptz;

update public.referrals
   set slot_position = slot_number
 where slot_position is null and slot_number is not null;

-- 2. Referral rows: admin only (contractors get counts through the function below)
drop policy if exists "Referrals read access for involved parties" on public.referrals;
drop policy if exists "Admins read referrals" on public.referrals;
create policy "Admins read referrals" on public.referrals
  for select to authenticated using (public.is_admin());

drop policy if exists "Contractors update own referrals or admin updates all" on public.referrals;
drop policy if exists "Admins update referrals" on public.referrals;
create policy "Admins update referrals" on public.referrals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3. Counts only, for the signed-in contractor
create or replace function public.my_referral_tally()
returns table (this_week bigint, this_month bigint, this_quarter bigint, this_year bigint, all_time bigint)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with t as (select now() at time zone 'America/Chicago' as local_now)
  select
    count(r.id) filter (where r.created_at >= (date_trunc('week',    t.local_now) at time zone 'America/Chicago')),
    count(r.id) filter (where r.created_at >= (date_trunc('month',   t.local_now) at time zone 'America/Chicago')),
    count(r.id) filter (where r.created_at >= (date_trunc('quarter', t.local_now) at time zone 'America/Chicago')),
    count(r.id) filter (where r.created_at >= (date_trunc('year',    t.local_now) at time zone 'America/Chicago')),
    count(r.id)
  from t
  left join public.referrals r
    on r.contractor_id in (select cp.id from public.contractor_profiles cp where cp.user_id = auth.uid())
$function$;

revoke all on function public.my_referral_tally() from public, anon;
grant execute on function public.my_referral_tally() to authenticated;

-- 4. One referral per contractor per request
do $$ begin
  if exists (select 1 from public.referrals group by job_request_id, contractor_id having count(*) > 1) then
    raise exception 'referrals has duplicate contractor/request rows; resolve before applying';
  end if;
end $$;
create unique index if not exists referrals_one_per_contractor_request
  on public.referrals (job_request_id, contractor_id);

-- 5. Related tables: admin and server only
drop policy if exists "Job assignments read access for involved parties" on public.job_assignments;
drop policy if exists "Admins read job assignments" on public.job_assignments;
create policy "Admins read job assignments" on public.job_assignments
  for select to authenticated using (public.is_admin());

drop policy if exists "Contractors update own assignments or admin updates all" on public.job_assignments;
drop policy if exists "Admins update job assignments" on public.job_assignments;
create policy "Admins update job assignments" on public.job_assignments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can read job_request_categories" on public.job_request_categories;
drop policy if exists "Admins read job_request_categories" on public.job_request_categories;
create policy "Admins read job_request_categories" on public.job_request_categories
  for select to authenticated using (public.is_admin());

commit;
