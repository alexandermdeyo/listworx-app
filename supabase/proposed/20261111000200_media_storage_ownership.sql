-- PROPOSED — not applied. Contractor media ownership (logos and contractor-work-photos buckets).
--
-- Problem (confirmed against production policies on 2026-11-10, read-only):
--   logos:                  any signed-in user may INSERT anywhere, UPDATE (overwrite) any file, DELETE any file.
--   contractor-work-photos: any signed-in user may INSERT anywhere and DELETE any file.
-- Fix: signed-in users may only write, overwrite or delete files whose first folder is their own
-- auth user id (`<user id>/...`, see lib/media-paths.ts); admins (public.is_admin()) keep full access.
-- Public read access and the buckets themselves are unchanged. The realtor brand-kit upload uses the
-- server key and its own `<user id>/brand/...` folder, so it is unaffected.
--
-- Storage policies live on storage.objects. If the SQL editor refuses (ownership), create the same
-- policies in Dashboard → Storage → Policies using the expressions below.

begin;

-- logos -----------------------------------------------------------------------------------------
drop policy if exists "Authenticated users can upload logos" on storage.objects;
drop policy if exists "Authenticated users can update logos" on storage.objects;
drop policy if exists "Authenticated users can delete logos" on storage.objects;

create policy "Owners upload logos to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

create policy "Owners update own logos" on storage.objects
  for update to authenticated
  using      (bucket_id = 'logos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())))
  with check (bucket_id = 'logos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

create policy "Owners delete own logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- contractor-work-photos -------------------------------------------------------------------------
drop policy if exists work_photos_bucket_auth_write  on storage.objects;
drop policy if exists work_photos_bucket_auth_delete on storage.objects;

create policy work_photos_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contractor-work-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- Needed for upsert (the flyer builder re-uploads); limited to the owner's folder.
create policy work_photos_owner_update on storage.objects
  for update to authenticated
  using      (bucket_id = 'contractor-work-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())))
  with check (bucket_id = 'contractor-work-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

create policy work_photos_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'contractor-work-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- contractor_work_photos rows may only point at files in the owner's own folder ----------------
-- (0 rows in production on 2026-11-10, so no existing row is affected.)
drop policy if exists work_photos_owner_write on public.contractor_work_photos;
create policy work_photos_owner_write on public.contractor_work_photos
  for all to authenticated
  using (is_admin() or contractor_id in (select id from public.contractor_profiles where user_id = auth.uid()))
  with check (
    is_admin()
    or (
      contractor_id in (select id from public.contractor_profiles where user_id = auth.uid())
      and (storage_path is null or split_part(storage_path, '/', 1) = auth.uid()::text)
    )
  );

commit;
