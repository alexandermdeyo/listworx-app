-- Rollback for 20261116000200_photo_private_storage.sql.
-- Files are never deleted: the private "photo-library" bucket and everything in it are
-- KEPT (only its upload/read rules are removed), and public copies stay where they are.
-- Rows whose original is in private storage keep pointing there; after rollback the
-- website code must also be rolled back to the version before private storage.
begin;

drop function if exists public.photo_public_copy(uuid, text, uuid, text, text, text);
drop function if exists public.photo_secure_original(uuid, uuid, text);

-- Restore the Stage 2 guard (public_url treated as part of the file again).
create or replace function public.photo_assets_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    new.review_checklist := '{}'::jsonb;
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
    if new.storage_path is distinct from old.storage_path or new.sha256 is distinct from old.sha256
       or new.public_url is distinct from old.public_url or new.width is distinct from old.width
       or new.height is distinct from old.height or new.file_size is distinct from old.file_size then
      raise exception 'The stored file of a library photo cannot be changed' using errcode = '42501';
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

alter table public.photo_assets drop constraint if exists photo_assets_original_location;
alter table public.photo_assets drop constraint if exists photo_assets_public_path_location;
alter table public.photo_assets drop constraint if exists photo_assets_live_copy_has_url;
drop index if exists photo_assets_public_live_idx;
alter table public.photo_assets drop column if exists public_copy_live;
alter table public.photo_assets drop column if exists public_path;
-- public_url stays nullable and storage_bucket keeps its new default: tightening them
-- again could fail on rows created while private storage was in use.

do $storage$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  execute 'drop policy if exists "Admins upload photo library originals" on storage.objects';
  execute 'drop policy if exists "Admins read photo library originals" on storage.objects';
end
$storage$;

commit;
