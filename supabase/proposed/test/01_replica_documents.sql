-- Document, trade and settings tables as in production (2026-11-10), plus
-- their RLS policies, for testing 20261111000100_document_compliance.sql.
create type public.document_type as enum ('LICENSE','INSURANCE','CERTIFICATION','OTHER','AWARD');
create type public.document_status as enum ('PENDING','APPROVED','REJECTED','EXPIRED');

create table public.contractor_documents (
  id uuid default gen_random_uuid() primary key,
  contractor_id uuid references public.contractor_profiles(id) on delete cascade,
  document_type document_type,
  document_url text,
  expiration_date date,
  status document_status default 'PENDING'::document_status,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text default ''::text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  file_name text,
  label text,
  is_public boolean default false,
  storage_path text
);
create table public.categories (id uuid default gen_random_uuid() primary key, name text not null, description text, icon text, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.contractor_categories (id uuid default gen_random_uuid() primary key, contractor_id uuid references public.contractor_profiles(id) on delete cascade, category_id uuid references public.categories(id), created_at timestamptz default now());
create table public.states (id uuid default gen_random_uuid() primary key, code text not null, name text not null, is_active boolean default true, created_at timestamptz default now());
create table public.counties (id uuid default gen_random_uuid() primary key, state_id uuid references public.states(id), name text not null, fips text, is_active boolean default true, created_at timestamptz default now(), state_code text);
create table public.contractor_counties (id uuid default gen_random_uuid() primary key, contractor_id uuid references public.contractor_profiles(id) on delete cascade, county_id uuid references public.counties(id), created_at timestamptz default now());
create table public.admin_settings (id uuid default gen_random_uuid() primary key, key text not null unique, value text, updated_at timestamptz default now(), updated_by uuid);

alter table public.contractor_documents enable row level security;
create policy "Admin can delete contractor documents" on public.contractor_documents for delete to authenticated using (is_admin());
create policy "Contractors delete own non-compliance documents" on public.contractor_documents for delete to authenticated
  using ((document_type <> all (array['LICENSE'::document_type, 'INSURANCE'::document_type])) and (contractor_id in (select id from contractor_profiles where user_id = auth.uid())));
create policy "Contractors insert own documents or admin inserts all" on public.contractor_documents for insert to authenticated
  with check ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create policy "Contractors update own documents or admin updates all" on public.contractor_documents for update to authenticated
  using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin())
  with check ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());
create policy "Contractors view own documents or admin views all" on public.contractor_documents for select to authenticated
  using ((contractor_id in (select id from contractor_profiles where user_id = (select auth.uid()))) or is_admin());

alter table public.categories enable row level security;
create policy "Categories read access for all" on public.categories for select to anon, authenticated using (is_active = true);
create policy "Categories update admin only" on public.categories for update to authenticated using (is_admin());
alter table public.contractor_categories enable row level security;
create policy "Contractor categories read access" on public.contractor_categories for select to authenticated using (true);
alter table public.counties enable row level security;
create policy "Anyone can view active counties" on public.counties for select to public using (is_active = true);
alter table public.contractor_counties enable row level security;
create policy "Authenticated users can view contractor counties" on public.contractor_counties for select to authenticated using (true);
alter table public.admin_settings enable row level security;
create policy "Admins manage all settings" on public.admin_settings for all to authenticated using (is_admin());

grant select, insert, update, delete on public.contractor_documents, public.categories, public.contractor_categories, public.admin_settings, public.states, public.counties, public.contractor_counties to anon, authenticated, service_role;
