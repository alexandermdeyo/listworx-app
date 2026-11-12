-- Local stand-in for the storage pieces the media-ownership fix touches.
-- storage.foldername, is_admin and all policies below are copied verbatim from
-- production (read-only queries, 2026-11-10). auth.uid() and roles are simulated.
-- Never run against Supabase.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid
$$;

create type public.user_role as enum ('ADMIN','CONTRACTOR','REALTOR','HOMEOWNER','PROPERTY_MANAGER');
create table public.users (id uuid primary key, role user_role not null default 'CONTRACTOR', name text not null default '', email text not null default '');
create table public.contractor_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.users(id), company_name text not null);
create table public.contractor_work_photos (id uuid primary key default gen_random_uuid(), contractor_id uuid not null references public.contractor_profiles(id) on delete cascade, storage_path text, public_url text, caption text, display_order integer default 0, created_at timestamptz default now());

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'::user_role);
$function$;

create schema storage;
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null, name text not null, owner_id text, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now(), unique (bucket_id, name));
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE plpgsql IMMUTABLE AS $function$
DECLARE _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$function$;

alter table storage.objects enable row level security;
alter table public.contractor_work_photos enable row level security;
alter table public.contractor_profiles enable row level security;
create policy cp_read on public.contractor_profiles for select using (true);

grant usage on schema auth, storage, public to anon, authenticated, service_role;
grant all on all tables in schema storage, public to anon, authenticated, service_role;

-- Production policies as of 2026-11-10 (verbatim expressions)
create policy "Anyone can view logos" on storage.objects for select to public using (bucket_id = 'logos'::text);
create policy "Authenticated users can delete logos" on storage.objects for delete to authenticated using (bucket_id = 'logos'::text);
create policy "Authenticated users can update logos" on storage.objects for update to authenticated using (bucket_id = 'logos'::text) with check (bucket_id = 'logos'::text);
create policy "Authenticated users can upload logos" on storage.objects for insert to authenticated with check (bucket_id = 'logos'::text);
create policy work_photos_bucket_auth_delete on storage.objects for delete to authenticated using (bucket_id = 'contractor-work-photos'::text);
create policy work_photos_bucket_auth_write on storage.objects for insert to authenticated with check (bucket_id = 'contractor-work-photos'::text);
create policy work_photos_bucket_public_read on storage.objects for select to public using (bucket_id = 'contractor-work-photos'::text);
create policy work_photos_owner_write on public.contractor_work_photos for all to authenticated
  using (is_admin() or contractor_id in (select contractor_profiles.id from contractor_profiles where contractor_profiles.user_id = auth.uid()))
  with check (is_admin() or contractor_id in (select contractor_profiles.id from contractor_profiles where contractor_profiles.user_id = auth.uid()));
create policy work_photos_public_read on public.contractor_work_photos for select to anon, authenticated using (true);

-- Test helper: run one statement as a signed-in user (or anon when uid is null).
-- Returns 'ok:<rows>' or 'denied:<sqlstate>'.
create schema test;
create function test.attempt(uid uuid, stmt text) returns text language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', case when uid is null then '{"role":"anon"}' else json_build_object('sub', uid, 'role', 'authenticated')::text end, true);
  execute case when uid is null then 'set local role anon' else 'set local role authenticated' end;
  begin
    execute stmt;
    get diagnostics n = row_count;
  exception when others then
    execute 'reset role';
    return 'denied:' || sqlstate;
  end;
  execute 'reset role';
  return 'ok:' || n;
end $$;
grant usage on schema test to anon, authenticated;

-- Seed: admin, contractors A and B, a realtor; files as production code lays them out.
insert into public.users (id, role) values
  ('a0000000-0000-4000-8000-000000000001', 'ADMIN'),
  ('a0000000-0000-4000-8000-00000000000a', 'CONTRACTOR'),
  ('a0000000-0000-4000-8000-00000000000b', 'CONTRACTOR'),
  ('a0000000-0000-4000-8000-0000000000ee', 'REALTOR');
insert into public.contractor_profiles (id, user_id, company_name) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', 'A Co'),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-00000000000b', 'B Co');
