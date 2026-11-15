-- Rollback for 20261116000100_photo_library.sql.
-- Removes the catalogue only. Uploaded files in site-media/library/ are NOT deleted
-- (originals are preserved); articles that use them keep working because they
-- reference the public file address, not the catalogue row.
begin;
drop function if exists public.photo_review(uuid, text, uuid, text, jsonb);
drop trigger if exists photo_assets_guard on public.photo_assets;
drop function if exists public.photo_assets_guard();
drop table if exists public.photo_review_log;
drop table if exists public.photo_assets;
commit;
