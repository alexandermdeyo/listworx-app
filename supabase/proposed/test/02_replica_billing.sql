-- Production definitions (read 2026-11-12) of tiers and subscriptions, with their RLS policies.
create type public.subscription_status as enum ('ACTIVE','PAST_DUE','CANCELLED','INCOMPLETE','TRIALING');
create table public.tiers (id uuid default gen_random_uuid() not null primary key, name text not null unique, monthly_price integer default 0 not null, annual_price integer default 0 not null, features_json jsonb default '[]'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.subscriptions (id uuid default gen_random_uuid() not null primary key, contractor_id uuid not null references public.contractor_profiles(id) on delete cascade, tier_id uuid not null references public.tiers(id), status public.subscription_status default 'INCOMPLETE'::public.subscription_status, stripe_subscription_id text unique, current_period_start timestamptz, current_period_end timestamptz, cancel_at timestamptz, cancelled_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
insert into public.tiers (name, monthly_price, annual_price) values
  ('Network Member — Founding', 19900, 199000), ('Network Member — Standard', 24900, 249000),
  ('Network Partner — Founding', 34900, 349000), ('Network Partner — Standard', 42900, 429000),
  ('Network Elite — Founding', 59900, 599000), ('Network Elite — Standard', 72900, 729000);
alter table public.tiers enable row level security;
alter table public.subscriptions enable row level security;
create policy "Tiers read access" on public.tiers for select to authenticated using (true);
create policy "Subscriptions delete admin only" on public.subscriptions for delete to authenticated using (is_admin());
create policy "Subscriptions insert admin or system" on public.subscriptions for insert to authenticated with check (is_admin());
create policy "Subscriptions read access" on public.subscriptions for select to authenticated using (((contractor_id in (select contractor_profiles.id from contractor_profiles where (contractor_profiles.user_id = (select auth.uid() as uid)))) or is_admin()));
create policy "Subscriptions update admin or system" on public.subscriptions for update to authenticated using (is_admin()) with check (is_admin());
grant select, insert, update, delete on public.tiers, public.subscriptions to anon, authenticated, service_role;
