-- ============================================================================
-- PROPOSED — Stage 2 photo library. Owner-approved for TEST only (2026-11-14).
-- Not applied to production.
--
-- Files live in the existing public "site-media" bucket under library/…
-- (uploaded by admins with upsert disabled, so nothing is ever overwritten).
-- This table is the catalogue: metadata, rights, AI flag, focus point, review.
--
-- Safety rules enforced HERE (not just in the website):
--   * every new photo starts as "pending"; inserts cannot set approval fields
--   * status changes only through photo_review() (SECURITY DEFINER, server key only)
--   * approval needs alt text, known usage rights and a named reviewer
--   * AI-generated photos need the three-point human review checklist to be approved
--   * changing the AI flag or usage rights of an approved photo sends it back to pending
--   * rows cannot be deleted (archive instead); the app never deletes files
-- ============================================================================
begin;

create table if not exists public.photo_assets (
  id                uuid primary key default gen_random_uuid(),
  storage_bucket    text not null default 'site-media',
  storage_path      text not null unique,
  public_url        text not null,
  original_filename text not null,
  mime_type         text not null,
  file_size         integer not null check (file_size > 0),
  width             integer not null check (width > 0),
  height            integer not null check (height > 0),
  sha256            text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  dhash             text check (dhash is null or dhash ~ '^[0-9a-f]{16}$'),
  title             text,
  description       text,
  alt_text          text check (alt_text is null or char_length(alt_text) <= 300),
  category          text,
  tags              text[] not null default '{}',
  intended_uses     text[] not null default '{}'
                    check (intended_uses <@ array['blog_featured','blog_inline','newsletter','social','website']::text[]),
  source            text,
  usage_rights      text not null default 'unknown'
                    check (usage_rights in ('owned','licensed','free_stock','ai_generated','unknown')),
  rights_notes      text,
  is_ai_generated   boolean not null default false,
  quality_flags     text[] not null default '{}'
                    check (quality_flags <@ array['unnatural_details','text_errors','low_quality','misleading','crop_risk']::text[]),
  focus_x           smallint check (focus_x is null or focus_x between 0 and 100),
  focus_y           smallint check (focus_y is null or focus_y between 0 and 100),
  status            text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note       text,
  review_checklist  jsonb not null default '{}'::jsonb check (jsonb_typeof(review_checklist) = 'object'),
  reviewed_by       uuid,
  reviewed_at       timestamptz,
  archived          boolean not null default false,
  import_batch      text,
  external_ref      text,
  uploaded_by       uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint photo_assets_storage_path_library check (storage_path like 'library/%'),
  constraint photo_assets_approval_requirements check (
    status <> 'approved' or (
      reviewed_by is not null
      and coalesce(btrim(alt_text), '') <> ''
      and usage_rights <> 'unknown'
    )
  ),
  constraint photo_assets_ai_review_required check (
    status <> 'approved' or not is_ai_generated or (
      coalesce((review_checklist ->> 'hands_faces_natural')::boolean, false)
      and coalesce((review_checklist ->> 'text_and_signs_correct')::boolean, false)
      and coalesce((review_checklist ->> 'not_presented_as_real')::boolean, false)
    )
  ),
  constraint photo_assets_rejection_reason check (status <> 'rejected' or coalesce(btrim(review_note), '') <> '')
);

create index if not exists photo_assets_sha256_idx on public.photo_assets (sha256);
create index if not exists photo_assets_status_idx on public.photo_assets (status) where not archived;
create index if not exists photo_assets_public_url_idx on public.photo_assets (public_url);
create index if not exists photo_assets_tags_idx on public.photo_assets using gin (tags);

create table if not exists public.photo_review_log (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid references public.photo_assets(id) on delete set null,
  action      text not null,
  from_status text,
  to_status   text,
  actor_id    uuid,
  note        text,
  checklist   jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists photo_review_log_asset_idx on public.photo_review_log (asset_id, created_at desc);

-- Guard: approval fields only change through photo_review(); new rows start pending.
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
    -- The file itself never changes after upload.
    if new.storage_path is distinct from old.storage_path or new.sha256 is distinct from old.sha256
       or new.public_url is distinct from old.public_url or new.width is distinct from old.width
       or new.height is distinct from old.height or new.file_size is distinct from old.file_size then
      raise exception 'The stored file of a library photo cannot be changed' using errcode = '42501';
    end if;
    -- Rights or AI status changed on an approved photo: it needs review again.
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

drop trigger if exists photo_assets_guard on public.photo_assets;
create trigger photo_assets_guard
  before insert or update on public.photo_assets
  for each row execute function public.photo_assets_guard();

-- The only way to approve, reject or reset a photo.
create or replace function public.photo_review(
  p_asset_id  uuid,
  p_decision  text,
  p_actor_id  uuid,
  p_note      text default null,
  p_checklist jsonb default '{}'::jsonb
)
returns public.photo_assets
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.photo_assets;
  next text;
  result public.photo_assets;
begin
  select * into cur from public.photo_assets where id = p_asset_id for update;
  if not found then
    raise exception 'Photo not found' using errcode = 'P0002';
  end if;
  if p_actor_id is null then
    raise exception 'A reviewer is required' using errcode = '22023';
  end if;
  if cur.archived then
    raise exception 'Archived photos cannot be reviewed' using errcode = '22023';
  end if;

  next := case p_decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'reset' then 'pending' else null end;
  if next is null then
    raise exception 'Unknown review decision' using errcode = '22023';
  end if;
  if p_decision = 'reject' and coalesce(btrim(p_note), '') = '' then
    raise exception 'A reason is required to reject a photo' using errcode = '22023';
  end if;
  if p_decision = 'approve' and coalesce(btrim(cur.alt_text), '') = '' then
    raise exception 'Add alt text before approving' using errcode = '22023';
  end if;
  if p_decision = 'approve' and cur.usage_rights = 'unknown' then
    raise exception 'Record the usage rights before approving' using errcode = '22023';
  end if;
  if p_decision = 'approve' and cur.is_ai_generated and not (
       coalesce((p_checklist ->> 'hands_faces_natural')::boolean, false)
       and coalesce((p_checklist ->> 'text_and_signs_correct')::boolean, false)
       and coalesce((p_checklist ->> 'not_presented_as_real')::boolean, false)) then
    raise exception 'AI-generated photos need all three review checks before approval' using errcode = '22023';
  end if;

  perform set_config('listworx.photo_review', 'on', true);
  update public.photo_assets
     set status = next,
         review_note = nullif(btrim(p_note), ''),
         review_checklist = case when next = 'pending' then '{}'::jsonb else coalesce(p_checklist, '{}'::jsonb) end,
         reviewed_by = case when next = 'pending' then null else p_actor_id end,
         reviewed_at = case when next = 'pending' then null else now() end,
         updated_at = now()
   where id = p_asset_id
  returning * into result;
  perform set_config('listworx.photo_review', 'off', true);

  insert into public.photo_review_log (asset_id, action, from_status, to_status, actor_id, note, checklist)
  values (p_asset_id, p_decision, cur.status, next, p_actor_id, nullif(btrim(p_note), ''), p_checklist);
  return result;
end
$function$;

-- Permissions: admins (signed in) may read; the website server writes metadata and
-- registers uploads; nobody can delete rows; approval only via photo_review().
alter table public.photo_assets enable row level security;
alter table public.photo_review_log enable row level security;
revoke all on public.photo_assets, public.photo_review_log from anon, authenticated, service_role;
grant select on public.photo_assets, public.photo_review_log to authenticated;
grant select, insert, update on public.photo_assets to service_role;
grant select on public.photo_review_log to service_role;
create policy "Admins read photo library" on public.photo_assets for select to authenticated using (public.is_admin());
create policy "Admins read photo review log" on public.photo_review_log for select to authenticated using (public.is_admin());

revoke all on function public.photo_review(uuid, text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.photo_review(uuid, text, uuid, text, jsonb) to service_role;
revoke all on function public.photo_assets_guard() from public, anon, authenticated;

commit;
