-- ============================================================================
-- REFERENCE ONLY — NOT A MIGRATION. DO NOT RUN THIS FILE.
-- ============================================================================
-- This file is NOT inside supabase/migrations/ on purpose, and must never be
-- moved there as-is. It documents security objects that are ALREADY LIVE in
-- production (project ref tvakopbahmhnijprsgkd) so the repository stops being
-- silent about work the database has had since 2026-11-08. It was produced by
-- read-only introspection (pg_proc, pg_trigger, pg_enum, pg_roles,
-- information_schema) against production during the ListWorx 2.0 IronClad
-- Certification security review (Phases 1B-1E), captured 2026-11-16.
--
-- If this is ever adopted as a real migration (e.g. to backfill git history,
-- or to apply to a freshly-reset branch), that is a separate, deliberate step
-- requiring its own explicit approval — do not infer that approval from the
-- existence of this file. Every statement below is written CREATE OR
-- REPLACE / idempotent-safe specifically so that, if it is ever run against
-- an environment that already has these objects, it changes nothing.
--
-- Source migrations in production's ledger (not present as files in this
-- repo's supabase/migrations/ at the time this was written):
--   20261108055459  lock_roles_and_contractor_status
--   20261108055513  fix_privileged_writer_check
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Dependency: enum types referenced by the functions below.
-- Captured as-is from production (pg_enum). Included so the functions below
-- are legible without a live database connection — this block intentionally
-- contains no CREATE TYPE statements, since these types already exist
-- everywhere this matters (production and the security-compliance-test
-- branch both have them) and redefining an enum in place is not a safe
-- idempotent operation the way CREATE OR REPLACE FUNCTION is.
--
--   partner_status  (used by contractor_profiles.partner_status):
--     applied, under_review, approved, active, suspended, rejected,
--     cancelled, paused, removed
--
--   user_role  (used by users.role):
--     ADMIN, CONTRACTOR, REALTOR, HOMEOWNER, PROPERTY_MANAGER
--
--   document_status  (used by contractor_documents.status):
--     PENDING, APPROVED, REJECTED, EXPIRED
--
--   document_type  (used by contractor_documents.document_type):
--     LICENSE, INSURANCE, CERTIFICATION, OTHER, AWARD
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- public.is_admin()
-- Dependency of is_privileged_writer() below. Owner: postgres.
-- Grants: EXECUTE to postgres, anon, authenticated, service_role.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'ADMIN'::user_role
  );
$function$;


-- ----------------------------------------------------------------------------
-- public.is_privileged_writer()
-- The shared gate every guard_* trigger below calls. True for: direct DB
-- sessions carrying no API JWT (migrations, dashboard SQL editor), the
-- service_role key (used by stripe-webhook and server-side admin API
-- routes), or an authenticated admin per is_admin(). Owner: postgres.
-- Grants: EXECUTE to PUBLIC, postgres, anon, authenticated, service_role.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_privileged_writer()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    -- direct database sessions (migrations, dashboard) carry no API JWT
    coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role' is null
    or coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role' = 'service_role'
    or public.is_admin();
$function$;


-- ----------------------------------------------------------------------------
-- public.guard_contractor_profile()
-- Trigger: guard_contractor_profile BEFORE INSERT OR UPDATE ON
--   public.contractor_profiles FOR EACH ROW EXECUTE FUNCTION
--   guard_contractor_profile()
-- Owner: postgres. Grants: EXECUTE to PUBLIC, postgres, anon, authenticated,
-- service_role (callable as a trigger only — RETURNS trigger — direct RPC
-- invocation errors).
--
-- For any non-privileged writer: on INSERT, forces partner_status to
-- 'applied' (unless already applied/under_review) and zeroes every
-- admin/billing/certification field. On UPDATE, only allows partner_status
-- to move to 'applied' from null/applied/under_review/rejected, and reverts
-- every other admin-controlled field (ironclad_certified, founding_partner*,
-- subscription/Stripe fields, founder fields, archived, review counters,
-- profile_published, profile_slug, total_referrals_received, user_id) to
-- its prior value.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_contractor_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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


-- ----------------------------------------------------------------------------
-- public.guard_contractor_document()
-- Trigger: guard_contractor_document BEFORE INSERT OR UPDATE ON
--   public.contractor_documents FOR EACH ROW EXECUTE FUNCTION
--   guard_contractor_document()
-- Owner: postgres. Grants: EXECUTE to PUBLIC, postgres, anon, authenticated,
-- service_role (trigger-only, as above).
--
-- For a privileged writer changing status to APPROVED/REJECTED, auto-stamps
-- reviewed_at/reviewed_by when the admin UI didn't set them. For a
-- non-privileged writer: INSERT always lands as PENDING with no reviewer;
-- UPDATE cannot touch reviewed_by/reviewed_at/contractor_id/document_type
-- (raises 42501), cannot set status to anything but PENDING directly
-- (raises 42501), re-upload (new document_url/storage_path/file_name/
-- expiration_date) resets status back to PENDING, and notes cannot be
-- changed once a decision has been made (raises 42501).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_contractor_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.is_privileged_writer() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status
       and new.status in ('APPROVED', 'REJECTED') then
      if new.reviewed_at is not distinct from old.reviewed_at then
        new.reviewed_at := now();
      end if;
      if new.reviewed_by is not distinct from old.reviewed_by and auth.uid() is not null then
        new.reviewed_by := auth.uid();
      end if;
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'PENDING';
    new.reviewed_by := null;
    new.reviewed_at := null;
    return new;
  end if;
  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.contractor_id is distinct from old.contractor_id
     or new.document_type is distinct from old.document_type then
    raise exception 'Only ListWorx administrators can review documents.' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status is distinct from 'PENDING' then
    raise exception 'Only ListWorx administrators can approve or reject documents.' using errcode = '42501';
  end if;
  if new.expiration_date is distinct from old.expiration_date
     or new.document_url is distinct from old.document_url
     or new.storage_path is distinct from old.storage_path
     or new.file_name is distinct from old.file_name then
    new.status := 'PENDING';
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif new.notes is distinct from old.notes and new.status is distinct from 'PENDING' then
    raise exception 'Only ListWorx administrators can change review notes.' using errcode = '42501';
  end if;
  return new;
end
$function$;


-- ----------------------------------------------------------------------------
-- public.guard_user_role()
-- Trigger: guard_user_role BEFORE INSERT OR UPDATE ON public.users FOR EACH
--   ROW EXECUTE FUNCTION guard_user_role()
-- Owner: postgres. Grants: EXECUTE to PUBLIC, postgres, anon, authenticated,
-- service_role (trigger-only, as above).
--
-- Blocks any non-privileged writer from inserting a row with role='ADMIN',
-- or from changing role on either side of an update where either the old or
-- new value is 'ADMIN'.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.is_privileged_writer() then
    return new;
  end if;
  if tg_op = 'INSERT' and new.role::text = 'ADMIN' then
    raise exception 'Not allowed to assign the ADMIN role';
  end if;
  if tg_op = 'UPDATE' and new.role is distinct from old.role
     and (new.role::text = 'ADMIN' or old.role::text = 'ADMIN') then
    raise exception 'Not allowed to change the ADMIN role';
  end if;
  return new;
end $function$;


-- ============================================================================
-- Known gap, noted but intentionally NOT addressed here:
-- contractor_applications has no equivalent guard trigger. It only has
-- update_contractor_application_updated_at_trigger. Its RLS (anon INSERT-only
-- on submission, admin-only authenticated UPDATE) appears to make a guard
-- trigger unnecessary today, but this is worth re-checking if that table's
-- RLS ever changes.
--
-- Incidental, unrelated observation from this review (not part of the four
-- functions this file documents, not touched, not in scope to fix here):
-- public.can_contractor_be_active(uuid) compares contractor_profiles.
-- partner_status to the string 'ACTIVE' (uppercase), but the partner_status
-- enum's actual labels are lowercase ('active', not 'ACTIVE'). As written,
-- that specific comparison would raise an invalid-enum-value error rather
-- than evaluate to false. Flagging for awareness only.
-- ============================================================================
