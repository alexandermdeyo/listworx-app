-- Security: users could promote themselves to ADMIN, and contractors could
-- mark their own profile active/approved or change billing fields from the
-- browser. Only admins and the server (service role) may change these now.

create or replace function public.is_privileged_writer() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.role(), '') = 'service_role'
      or current_user in ('postgres', 'supabase_admin', 'service_role')
      or public.is_admin();
$$;

-- 1) Nobody can make themselves an admin.
create or replace function public.guard_user_role() returns trigger
language plpgsql security definer set search_path = public as $$
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
end $$;

drop trigger if exists guard_user_role on public.users;
create trigger guard_user_role before insert or update on public.users
  for each row execute function public.guard_user_role();

-- 2) Contractors can edit their profile, but not their status, plan,
--    billing, founder flags, stats or featured placement.
create or replace function public.guard_contractor_profile() returns trigger
language plpgsql security definer set search_path = public as $$
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

  -- UPDATE: keep protected fields as they were...
  if new.partner_status is distinct from old.partner_status then
    -- ...except re-submitting an application.
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
end $$;

drop trigger if exists guard_contractor_profile on public.contractor_profiles;
create trigger guard_contractor_profile before insert or update on public.contractor_profiles
  for each row execute function public.guard_contractor_profile();
