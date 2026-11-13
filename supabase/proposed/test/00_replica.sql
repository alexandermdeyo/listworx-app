-- Local stand-in for the parts of production ListWorx Supabase this migration
-- touches. Table/enum definitions copied from production (read-only queries,
-- 2026-11-10); auth.uid() and the Supabase roles are simulated.
-- Used only to test supabase/proposed/*.sql locally. Never run against Supabase.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;

create type public.job_status as enum ('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED');
create type public.partner_status as enum ('applied','under_review','approved','active','suspended','rejected','cancelled','paused','removed');
create type public.referral_status as enum ('PENDING','ACCEPTED','DECLINED','CONTACTED','COMPLETED');
create type public.user_role as enum ('ADMIN','CONTRACTOR','REALTOR','HOMEOWNER','PROPERTY_MANAGER');

create table public.users (id uuid default gen_random_uuid() not null primary key, role user_role default 'CONTRACTOR'::user_role not null, name text not null, email text not null, phone text default ''::text, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now());
create table public.contractor_profiles (id uuid default gen_random_uuid() not null primary key, user_id uuid not null unique references public.users(id) on delete cascade, company_name text not null, owner_name text not null, address_line1 text default ''::text, city text default ''::text, state text default ''::text, zip_code text default ''::text, website text default ''::text, license_number text default ''::text, license_expiration_date date, insurance_expiration_date date, insurance_document_url text default ''::text, years_in_business integer default 0, bio text default ''::text, service_area_counties text[] default '{}'::text[], average_rating numeric(3,2) default 0.00, total_jobs_completed integer default 0, partner_status partner_status default 'applied'::partner_status, agreed_to_standards boolean default false, agreed_to_communications boolean default false, agreed_to_privacy_policy boolean default false, ironclad_accepted boolean default false, ironclad_accepted_at timestamp with time zone, ironclad_agreement_version text default ''::text, stripe_customer_id text default ''::text, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), territory_lock_enabled boolean default false, service_area_state text default 'TN'::text, total_reviews integer default 0, archived boolean default false, email text, phone text, logo_url text, license_document_url text default ''::text, business_website text default ''::text, facebook_url text default ''::text, instagram_url text default ''::text, google_business_url text default ''::text, google_review_url text default ''::text, yelp_url text default ''::text, bbb_url text default ''::text, volume_acknowledged boolean default false, purchased_addons text[] default '{}'::text[], stripe_subscription_id text, subscription_status text default ''::text, subscription_current_period_end timestamp with time zone, subscription_tier text, founder_status boolean default false, founder_tier text, founder_activation_paid_at timestamp with time zone, trial_ends_at timestamp with time zone, founding_partner_badge boolean default false, founding_partner boolean default false, founding_partner_at timestamp with time zone, notification_email boolean default true not null, profile_video_url text, profile_video_title text, profile_video_description text, profile_video_is_public boolean default false not null, featured_on_homepage boolean default false, is_media_partner boolean default false not null, media_quarterly_rate numeric(10,2));
create table public.job_requests (id uuid default gen_random_uuid() not null primary key, requestor_profile_id uuid, requester_name text not null, requester_email text not null, job_description text not null, status job_status default 'PENDING'::job_status, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now());
create table public.referrals (id uuid default gen_random_uuid() not null primary key, job_request_id uuid not null references public.job_requests(id) on delete cascade, contractor_id uuid not null references public.contractor_profiles(id) on delete cascade, status referral_status default 'PENDING'::referral_status, notes text default ''::text, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), slot_number integer check (slot_number >= 1 and slot_number <= 3), contacted_at timestamp with time zone, hired_at timestamp with time zone, completed_at timestamp with time zone, job_value numeric);

-- Production function definitions (verbatim)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'::user_role);
$function$;

CREATE OR REPLACE FUNCTION public.is_privileged_writer() RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public' AS $function$
  select
    coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role' is null
    or coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'role' = 'service_role'
    or public.is_admin();
$function$;

CREATE OR REPLACE FUNCTION public.guard_contractor_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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

create trigger guard_contractor_profile before insert or update on public.contractor_profiles for each row execute function guard_contractor_profile();

-- Production RLS on contractor_profiles and referrals
alter table public.contractor_profiles enable row level security;
create policy "Contractors view own profile or admin views all" on public.contractor_profiles for select to authenticated using ((user_id = (select auth.uid())) or (select is_admin()));
create policy "Contractors update own profile or admin updates all" on public.contractor_profiles for update to authenticated using ((user_id = (select auth.uid())) or (select is_admin())) with check ((user_id = (select auth.uid())) or (select is_admin()));
create policy "Contractors insert own profile or admin inserts all" on public.contractor_profiles for insert to authenticated with check ((user_id = (select auth.uid())) or is_admin());
alter table public.referrals enable row level security;
create policy "Referrals read access for involved parties" on public.referrals for select to authenticated using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create policy "Contractors update own referrals or admin updates all" on public.referrals for update to authenticated using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin()) with check ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create type public.assignment_status as enum ('ASSIGNED','ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED','CANCELLED');
create table public.job_assignments (id uuid default gen_random_uuid() not null primary key, job_request_id uuid not null references public.job_requests(id) on delete cascade, contractor_id uuid not null references public.contractor_profiles(id) on delete cascade, referral_id uuid references public.referrals(id) on delete set null, status assignment_status default 'ASSIGNED'::assignment_status, assigned_at timestamptz default now(), completed_at timestamptz, notes text default ''::text, created_at timestamptz default now(), updated_at timestamptz default now());
alter table public.job_assignments enable row level security;
create policy "Job assignments read access for involved parties" on public.job_assignments for select to authenticated using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create policy "Contractors update own assignments or admin updates all" on public.job_assignments for update to authenticated using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin()) with check ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create table public.job_request_categories (id uuid default gen_random_uuid() not null primary key, job_request_id uuid not null references public.job_requests(id) on delete cascade, category_id uuid not null, created_at timestamptz default now());
alter table public.job_request_categories enable row level security;
create policy "Anyone can read job_request_categories" on public.job_request_categories for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
