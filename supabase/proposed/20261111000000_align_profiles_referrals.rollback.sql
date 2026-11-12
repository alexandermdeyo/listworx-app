-- ============================================================================
-- ROLLBACK for 20261111000000_align_profiles_referrals.sql — run only with
-- owner approval, and only if the migration must be undone. Restores the
-- production guard trigger and removes what the migration added. Dropping a
-- column deletes any values written to it after the migration ran.
-- ============================================================================
begin;

-- Restore production guard_contractor_profile() (captured 2026-11-10)
create or replace function public.guard_contractor_profile()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
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
  return new;
end $function$;

drop function if exists public.increment_referral_count(uuid);

drop index if exists public.referrals_one_chosen_per_request;
drop index if exists public.referrals_contractor_id_idx;
drop index if exists public.referrals_job_request_id_idx;
alter table public.referrals
  drop column if exists tier_at_referral,
  drop column if exists email_sent;

drop index if exists public.contractor_profiles_profile_slug_key;
alter table public.contractor_profiles drop constraint if exists contractor_profiles_profile_slug_format;
alter table public.contractor_profiles
  drop column if exists youtube_url,
  drop column if exists tiktok_url,
  drop column if exists linkedin_url,
  drop column if exists show_email_public,
  drop column if exists show_phone_public,
  drop column if exists profile_photo_url,
  drop column if exists tagline,
  drop column if exists business_description,
  drop column if exists total_referrals_received,
  drop column if exists profile_slug,
  drop column if exists profile_published,
  drop column if exists ironclad_certified;

commit;
