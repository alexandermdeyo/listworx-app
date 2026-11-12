-- ============================================================================
-- PROPOSED MIGRATION — NOT APPLIED. Requires owner approval before it runs anywhere.
--
-- Aligns production with columns the application already reads and writes,
-- and makes admin-controlled fields impossible for contractors to change.
-- Additive only: no drops, no renames, no data rewrites. Production had
-- 0 contractor_profiles, 0 job_requests and 0 referrals on 2026-11-10.
--
-- Not included on purpose (see the proposal doc):
--   * subscriptions / Stripe webhook mismatch — billing, separate decision
--   * code-only corrections (jobs_completed, tier, slot_position, brand_name,
--     audit_logs.contractor_id, active_contractors_view, email_notifications_enabled)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. contractor_profiles — admin-controlled status fields
-- ---------------------------------------------------------------------------
alter table public.contractor_profiles
  add column if not exists ironclad_certified       boolean not null default false,
  add column if not exists profile_published        boolean not null default false,
  add column if not exists profile_slug             text,
  add column if not exists total_referrals_received integer not null default 0;

comment on column public.contractor_profiles.ironclad_certified is
  'Awarded or revoked by a ListWorx administrator only. Not implied by ironclad_accepted, partner_status, or payment.';
comment on column public.contractor_profiles.profile_published is
  'Administrator authorization for the public profile page. Separate from partner_status approval.';
comment on column public.contractor_profiles.profile_slug is
  'Public URL slug. Set by an administrator or a server process, never by the contractor.';
comment on column public.contractor_profiles.total_referrals_received is
  'Referral rotation counter, incremented by increment_referral_count() when a referral is created.';

-- Slugs: lowercase words joined by single hyphens, unique regardless of case.
alter table public.contractor_profiles
  add constraint contractor_profiles_profile_slug_format
  check (profile_slug is null or profile_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
create unique index if not exists contractor_profiles_profile_slug_key
  on public.contractor_profiles (profile_slug) where profile_slug is not null;

-- ---------------------------------------------------------------------------
-- 2. contractor_profiles — contractor-editable profile fields the dashboard
--    editor already writes and the public profile page already reads.
--    Contact visibility defaults to hidden.
-- ---------------------------------------------------------------------------
alter table public.contractor_profiles
  add column if not exists business_description text,
  add column if not exists tagline              text,
  add column if not exists profile_photo_url    text,
  add column if not exists show_phone_public    boolean not null default false,
  add column if not exists show_email_public    boolean not null default false,
  add column if not exists linkedin_url         text,
  add column if not exists tiktok_url           text,
  add column if not exists youtube_url          text;

-- ---------------------------------------------------------------------------
-- 3. referrals — fields the admin CRM, contractor dashboard and resend-email
--    route already use; indexes; one chosen contractor per request.
-- ---------------------------------------------------------------------------
alter table public.referrals
  add column if not exists email_sent       boolean not null default false,
  add column if not exists tier_at_referral text;

create index if not exists referrals_job_request_id_idx on public.referrals (job_request_id);
create index if not exists referrals_contractor_id_idx  on public.referrals (contractor_id);

-- A request can have at most one chosen contractor. Closes the race where two
-- simultaneous clicks on different contractors could both be recorded.
create unique index if not exists referrals_one_chosen_per_request
  on public.referrals (job_request_id) where status in ('CONTACTED', 'COMPLETED');

-- ---------------------------------------------------------------------------
-- 4. Referral rotation counter function the matcher already calls
--    (lib/contractor-matching.ts → rpc('increment_referral_count')).
--    Callable only by the service role (server code), not by browsers.
-- ---------------------------------------------------------------------------
create or replace function public.increment_referral_count(contractor_id_input uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.contractor_profiles
     set total_referrals_received = coalesce(total_referrals_received, 0) + 1
   where id = contractor_id_input;
$$;
revoke all on function public.increment_referral_count(uuid) from public;
revoke all on function public.increment_referral_count(uuid) from anon, authenticated;
grant execute on function public.increment_referral_count(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 5. Guard trigger: production body unchanged, plus the four new
--    admin-controlled columns. Admins, the service role and direct database
--    sessions (is_privileged_writer) are unaffected; anyone else — a
--    contractor using the dashboard or calling the API with their own login —
--    cannot set or change them.
-- ---------------------------------------------------------------------------
create or replace function public.guard_contractor_profile()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.partner_status is null or new.partner_status::text not in ('applied', 'under_review') then
      new.partner_status := 'applied';
    end if;
    new.subscription_tier := null;
    new.subscription_status := null;
    new.subscription_current_period_end := null;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.founder_status := false;
    new.founder_tier := null;
    new.founder_activation_paid_at := null;
    new.founding_partner_badge := false;
    new.founding_partner := false;
    new.founding_partner_at := null;
    new.trial_ends_at := null;
    new.purchased_addons := null;
    new.featured_on_homepage := false;
    new.is_media_partner := false;
    new.media_quarterly_rate := null;
    new.archived := false;
    new.total_jobs_completed := 0;
    new.total_reviews := 0;
    new.average_rating := null;
    -- added by this migration
    new.ironclad_certified := false;
    new.profile_published := false;
    new.profile_slug := null;
    new.total_referrals_received := 0;
    return new;
  end if;

  if new.partner_status is distinct from old.partner_status then
    if not (new.partner_status::text = 'applied'
            and (old.partner_status is null or old.partner_status::text in ('applied', 'under_review', 'rejected'))) then
      new.partner_status := old.partner_status;
    end if;
  end if;
  new.subscription_tier := old.subscription_tier;
  new.subscription_status := old.subscription_status;
  new.subscription_current_period_end := old.subscription_current_period_end;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.founder_status := old.founder_status;
  new.founder_tier := old.founder_tier;
  new.founder_activation_paid_at := old.founder_activation_paid_at;
  new.founding_partner_badge := old.founding_partner_badge;
  new.founding_partner := old.founding_partner;
  new.founding_partner_at := old.founding_partner_at;
  new.trial_ends_at := old.trial_ends_at;
  new.purchased_addons := old.purchased_addons;
  new.featured_on_homepage := old.featured_on_homepage;
  new.is_media_partner := old.is_media_partner;
  new.media_quarterly_rate := old.media_quarterly_rate;
  new.archived := old.archived;
  new.total_jobs_completed := old.total_jobs_completed;
  new.total_reviews := old.total_reviews;
  new.average_rating := old.average_rating;
  new.user_id := old.user_id;
  -- added by this migration
  new.ironclad_certified := old.ironclad_certified;
  new.profile_published := old.profile_published;
  new.profile_slug := old.profile_slug;
  new.total_referrals_received := old.total_referrals_received;
  return new;
end $function$;

commit;
