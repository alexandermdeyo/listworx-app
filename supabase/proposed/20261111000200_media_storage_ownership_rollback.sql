-- Rollback for 20261111000200_media_storage_ownership.sql.
-- Restores the production policies exactly as read on 2026-11-10 — including the ownership hole.
-- Use only if the fix breaks uploads and you accept re-opening the vulnerability temporarily.

begin;

drop policy if exists "Owners upload logos to own folder" on storage.objects;
drop policy if exists "Owners update own logos" on storage.objects;
drop policy if exists "Owners delete own logos" on storage.objects;
drop policy if exists work_photos_owner_insert on storage.objects;
drop policy if exists work_photos_owner_update on storage.objects;
drop policy if exists work_photos_owner_delete on storage.objects;

create policy "Authenticated users can upload logos" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos');
create policy "Authenticated users can update logos" on storage.objects
  for update to authenticated using (bucket_id = 'logos') with check (bucket_id = 'logos');
create policy "Authenticated users can delete logos" on storage.objects
  for delete to authenticated using (bucket_id = 'logos');
create policy work_photos_bucket_auth_write on storage.objects
  for insert to authenticated with check (bucket_id = 'contractor-work-photos');
create policy work_photos_bucket_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'contractor-work-photos');

drop policy if exists work_photos_owner_write on public.contractor_work_photos;
create policy work_photos_owner_write on public.contractor_work_photos
  for all to authenticated
  using (is_admin() or contractor_id in (select id from public.contractor_profiles where user_id = auth.uid()))
  with check (is_admin() or contractor_id in (select id from public.contractor_profiles where user_id = auth.uid()));

commit;
