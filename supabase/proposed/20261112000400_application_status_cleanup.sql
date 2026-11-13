-- ============================================================================
-- PROPOSED — NOT APPLIED. One-time cleanup (owner-approved 2026-11-12).
--
-- Before the launch fix, approving a contractor changed only their profile, so
-- their application record stayed "pending". This corrects ONLY applications
-- whose contractor's profile proves they were approved:
--   * application status is 'pending', and
--   * a contractor profile with the same email (profile email, or the account
--     email of the profile's user) has partner_status 'approved' or 'active'.
-- Legitimate pending applications (no approved/active profile) are untouched.
-- Rejected, paused, suspended or removed contractors are untouched.
-- Every changed row is recorded in public.application_status_cleanup_20261112
-- so the rollback restores exactly those rows. Safe to re-run (no-op).
-- ============================================================================
begin;

create table if not exists public.application_status_cleanup_20261112 (
  application_id uuid primary key,
  previous_status text not null,
  changed_at timestamptz not null default now()
);
alter table public.application_status_cleanup_20261112 enable row level security;
-- no policies: admin/server only

with approved_emails as (
  select lower(trim(cp.email)) as email
    from public.contractor_profiles cp
   where cp.partner_status::text in ('approved', 'active') and cp.email is not null and trim(cp.email) <> ''
  union
  select lower(trim(u.email))
    from public.contractor_profiles cp
    join public.users u on u.id = cp.user_id
   where cp.partner_status::text in ('approved', 'active') and u.email is not null
),
targets as (
  select ca.id
    from public.contractor_applications ca
   where ca.status = 'pending'
     and lower(trim(ca.email)) in (select email from approved_emails)
),
logged as (
  insert into public.application_status_cleanup_20261112 (application_id, previous_status)
  select id, 'pending' from targets
  on conflict (application_id) do nothing
  returning application_id
)
update public.contractor_applications ca
   set status = 'approved', updated_at = now()
 where ca.id in (select application_id from logged);

commit;
