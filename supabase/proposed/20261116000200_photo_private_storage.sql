-- ============================================================================
-- PROPOSED — Stage 2 follow-up: private photo originals. TEST only until approved.
-- Requires 20261116000100_photo_library.sql.
--
-- * Originals live in a new PRIVATE bucket "photo-library" (originals/…). Admins
--   may upload there; nobody can overwrite or delete through the website.
-- * Only APPROVED photos get a public copy in the existing public "site-media"
--   bucket (library/…). Articles use that copy's address (public_url).
-- * When a photo stops being approved (rejected, back to pending, archived, rights
--   or AI flag changed) the website removes the public copy — unless a published
--   article still uses it, in which case the copy is kept ("retained"), the article
--   keeps working, and the admin is warned until it is resolved by hand.
-- * public_url is kept even after withdrawal so the publish guard can still
--   recognise the photo inside articles.
-- * Existing site-media files and other buckets are not changed by this migration.
-- ============================================================================
begin;

alter table public.photo_assets alter column public_url drop not null;
alter table public.photo_assets
  add column if not exists public_path      text,
  add column if not exists public_copy_live boolean not null default false;

-- Rows created before this change keep their file in the public bucket for now;
-- the admin "secure older photos" step moves their originals to private storage.
update public.photo_assets
   set public_path = storage_path, public_copy_live = true
 where storage_bucket = 'site-media' and public_path is null;

alter table public.photo_assets alter column storage_bucket set default 'photo-library';
alter table public.photo_assets drop constraint if exists photo_assets_storage_path_library;
alter table public.photo_assets
  add constraint photo_assets_original_location check (
    (storage_bucket = 'photo-library' and storage_path like 'originals/%')
    or (storage_bucket = 'site-media' and storage_path like 'library/%')
  ),
  add constraint photo_assets_public_path_location check (public_path is null or public_path like 'library/%'),
  add constraint photo_assets_live_copy_has_url check (not public_copy_live or (public_url is not null and public_path is not null));

create index if not exists photo_assets_public_live_idx on public.photo_assets (public_copy_live) where public_copy_live;

-- Guard: same rules as before, plus the original's location and the public copy
-- fields can only change through the functions below.
create or replace function public.photo_assets_guard()
returns trigger
language plpgsql
security definer -- needed to write the auto-reset entry to the review log
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    new.review_checklist := '{}'::jsonb;
    -- New uploads are private until approved.
    new.public_url := null;
    new.public_path := null;
    new.public_copy_live := false;
    return new;
  end if;

  if coalesce(current_setting('listworx.photo_review', true), '') <> 'on' then
    if new.status is distinct from old.status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.review_note is distinct from old.review_note
       or new.review_checklist is distinct from old.review_checklist then
      raise exception 'Photo approval can only be changed through the review step' using errcode = '42501';
    end if;
    if new.storage_bucket is distinct from old.storage_bucket or new.storage_path is distinct from old.storage_path
       or new.sha256 is distinct from old.sha256 or new.width is distinct from old.width
       or new.height is distinct from old.height or new.file_size is distinct from old.file_size then
      raise exception 'The stored file of a library photo cannot be changed' using errcode = '42501';
    end if;
    if new.public_url is distinct from old.public_url or new.public_path is distinct from old.public_path
       or new.public_copy_live is distinct from old.public_copy_live then
      raise exception 'The public copy can only be changed through the publishing step' using errcode = '42501';
    end if;
    if old.status = 'approved'
       and (new.is_ai_generated is distinct from old.is_ai_generated or new.usage_rights is distinct from old.usage_rights) then
      new.status := 'pending';
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.review_checklist := '{}'::jsonb;
      new.review_note := 'Returned to pending: AI flag or usage rights changed after approval';
      insert into public.photo_review_log (asset_id, action, from_status, to_status, actor_id, note)
      values (old.id, 'auto_reset', 'approved', 'pending', null, new.review_note);
    end if;
  end if;
  new.updated_at := now();
  return new;
end
$function$;

-- Records the state of the public copy after the website has created or removed the file.
--   created  : copy placed at p_path (must be approved and not archived)
--   removed  : copy deleted from the public bucket (address kept for the publish guard)
--   retained : photo no longer approved but published articles still use the copy
create or replace function public.photo_public_copy(
  p_asset_id uuid,
  p_action   text,
  p_actor_id uuid,
  p_path     text default null,
  p_url      text default null,
  p_note     text default null
)
returns public.photo_assets
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.photo_assets;
  result public.photo_assets;
begin
  select * into cur from public.photo_assets where id = p_asset_id for update;
  if not found then
    raise exception 'Photo not found' using errcode = 'P0002';
  end if;
  if p_action = 'created' then
    if cur.status <> 'approved' or cur.archived then
      raise exception 'Only approved, active photos can have a public copy' using errcode = '22023';
    end if;
    if coalesce(p_path, '') not like 'library/%' or coalesce(p_url, '') = '' then
      raise exception 'A public path under library/ and its address are required' using errcode = '22023';
    end if;
  elsif p_action not in ('removed', 'retained') then
    raise exception 'Unknown public copy action' using errcode = '22023';
  end if;

  perform set_config('listworx.photo_review', 'on', true);
  update public.photo_assets
     set public_path      = case when p_action = 'created' then p_path else public_path end,
         public_url       = case when p_action = 'created' then p_url else public_url end,
         public_copy_live = case p_action when 'created' then true when 'removed' then false else public_copy_live end,
         updated_at = now()
   where id = p_asset_id
  returning * into result;
  perform set_config('listworx.photo_review', 'off', true);

  insert into public.photo_review_log (asset_id, action, from_status, to_status, actor_id, note)
  values (p_asset_id, 'public_copy_' || p_action, cur.status, cur.status, p_actor_id, p_note);
  return result;
end
$function$;

-- Moves the catalogue entry of an older photo whose original sat in the public bucket
-- to its new private location (the website copies the file first).
create or replace function public.photo_secure_original(
  p_asset_id uuid,
  p_actor_id uuid,
  p_new_path text
)
returns public.photo_assets
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.photo_assets;
  result public.photo_assets;
begin
  select * into cur from public.photo_assets where id = p_asset_id for update;
  if not found then
    raise exception 'Photo not found' using errcode = 'P0002';
  end if;
  if cur.storage_bucket <> 'site-media' then
    raise exception 'This photo is already in private storage' using errcode = '22023';
  end if;
  if coalesce(p_new_path, '') not like 'originals/%' then
    raise exception 'The private path must be under originals/' using errcode = '22023';
  end if;

  perform set_config('listworx.photo_review', 'on', true);
  update public.photo_assets
     set storage_bucket = 'photo-library', storage_path = p_new_path, updated_at = now()
   where id = p_asset_id
  returning * into result;
  perform set_config('listworx.photo_review', 'off', true);

  insert into public.photo_review_log (asset_id, action, from_status, to_status, actor_id, note)
  values (p_asset_id, 'original_secured', cur.status, cur.status, p_actor_id, 'Original copied to private storage: ' || p_new_path);
  return result;
end
$function$;

revoke all on function public.photo_public_copy(uuid, text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.photo_public_copy(uuid, text, uuid, text, text, text) to service_role;
revoke all on function public.photo_secure_original(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.photo_secure_original(uuid, uuid, text) to service_role;
revoke all on function public.photo_assets_guard() from public, anon, authenticated;

-- Private bucket + admin upload/read rules (skipped on databases without Supabase storage).
do $storage$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present: skipping bucket and storage policies';
    return;
  end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('photo-library', 'photo-library', false, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

  execute 'drop policy if exists "Admins upload photo library originals" on storage.objects';
  execute 'create policy "Admins upload photo library originals" on storage.objects for insert to authenticated
           with check (bucket_id = ''photo-library'' and (storage.foldername(name))[1] = ''originals'' and (select public.is_admin()))';
  execute 'drop policy if exists "Admins read photo library originals" on storage.objects';
  execute 'create policy "Admins read photo library originals" on storage.objects for select to authenticated
           using (bucket_id = ''photo-library'' and (select public.is_admin()))';
  -- No update or delete policies: originals cannot be overwritten or removed through the website.
end
$storage$;

commit;
