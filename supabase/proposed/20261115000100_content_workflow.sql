-- ============================================================================
-- PROPOSED — Stage 1B content management foundation (owner-approved for TEST
-- only, 2026-11-14). Not applied to production.
--
-- Reuses public.blog_posts. The public blog keeps reading "is_draft = false"
-- (unchanged RLS policy and pages); the new status column drives the editorial
-- workflow and is kept in step with is_draft by a trigger, so the existing Blog
-- editor's publish/unpublish toggle keeps working exactly as before.
--
--   status: idea -> draft -> in_review -> approved -> scheduled -> published
--           (rejected can return to draft)
--
-- Internal review notes and approver identity live ONLY in the admin-only
-- content_publish_log, never on blog_posts (published rows are public).
-- The scheduler switch (automation_settings.scheduler_enabled) is OFF and
-- nothing in this stage publishes automatically.
-- ============================================================================
begin;

-- 1. Workflow and SEO fields on the existing table -------------------------
alter table public.blog_posts
  add column if not exists status             text,
  add column if not exists scheduled_for      timestamptz,
  add column if not exists seo_title          text,
  add column if not exists meta_description   text,
  add column if not exists featured_image_alt text,
  add column if not exists audience           text,
  add column if not exists category           text,
  add column if not exists sources            jsonb not null default '[]'::jsonb;

update public.blog_posts
   set status = case when is_draft then 'draft' else 'published' end
 where status is null;

alter table public.blog_posts alter column status set default 'draft';
alter table public.blog_posts alter column status set not null;

alter table public.blog_posts
  add constraint blog_posts_status_check
    check (status in ('idea', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected')),
  add constraint blog_posts_audience_check
    check (audience is null or audience in ('contractors', 'homeowners', 'realtors', 'general')),
  add constraint blog_posts_scheduled_needs_time
    check (status <> 'scheduled' or scheduled_for is not null),
  add constraint blog_posts_sources_is_array
    check (jsonb_typeof(sources) = 'array'),
  add constraint blog_posts_seo_title_length
    check (seo_title is null or char_length(seo_title) <= 120),
  add constraint blog_posts_meta_description_length
    check (meta_description is null or char_length(meta_description) <= 320);

create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_scheduled_due_idx
  on public.blog_posts (scheduled_for) where status = 'scheduled';

-- 2. Admin-only publication history / audit log -----------------------------
create table if not exists public.content_publish_log (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references public.blog_posts(id) on delete set null,
  post_title  text,
  action      text not null,
  from_status text,
  to_status   text,
  actor_id    uuid,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists content_publish_log_post_idx on public.content_publish_log (post_id, created_at desc);

alter table public.content_publish_log enable row level security;
revoke all on public.content_publish_log from anon, authenticated;
grant select on public.content_publish_log to authenticated;
grant select on public.content_publish_log to service_role; -- the admin API reads history; writes only via the functions below
create policy "Admins read content history" on public.content_publish_log
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: rows are written only by the functions below.

-- 3. Automation switches (single row), scheduler OFF ------------------------
create table if not exists public.automation_settings (
  id                boolean primary key default true check (id),
  scheduler_enabled boolean not null default false,
  updated_at        timestamptz not null default now(),
  updated_by        uuid
);
insert into public.automation_settings (id) values (true) on conflict (id) do nothing;

alter table public.automation_settings enable row level security;
revoke all on public.automation_settings from anon, authenticated;
grant select on public.automation_settings to authenticated;
grant select on public.automation_settings to service_role; -- the server reads the switch; it cannot change it
create policy "Admins read automation settings" on public.automation_settings
  for select to authenticated using (public.is_admin());
-- No update policy: the switch can only be changed by a reviewed migration or the server.

-- 4. Keep is_draft (public visibility) in step with status ------------------
create or replace function public.sync_blog_post_status()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    if new.status = 'published' or new.is_draft = false then
      new.status := 'published';
      new.is_draft := false;
      new.published_at := coalesce(new.published_at, now());
    else
      new.is_draft := true;
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- Workflow change wins: only "published" is public.
    new.is_draft := (new.status <> 'published');
    if new.status = 'published' then
      new.published_at := coalesce(new.published_at, now());
    end if;
  elsif new.is_draft is distinct from old.is_draft then
    -- Existing Blog editor toggle.
    if new.is_draft = false then
      new.status := 'published';
      new.published_at := coalesce(new.published_at, now());
    elsif old.status = 'published' then
      new.status := 'draft';
    end if;
  end if;

  if new.status <> 'scheduled' then
    new.scheduled_for := null;
  end if;
  return new;
end
$function$;

drop trigger if exists sync_blog_post_status on public.blog_posts;
create trigger sync_blog_post_status
  before insert or update on public.blog_posts
  for each row execute function public.sync_blog_post_status();

-- 5. History for status changes made outside content_apply_action ----------
--    (e.g. the existing Blog editor's publish toggle)
create or replace function public.log_blog_post_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(current_setting('listworx.content_logged', true), '') = 'on' then
    return null;
  end if;
  if tg_op = 'INSERT' then
    insert into public.content_publish_log (post_id, post_title, action, from_status, to_status, actor_id, note)
    values (new.id, new.title, 'created', null, new.status, auth.uid(), null);
  elsif new.status is distinct from old.status then
    insert into public.content_publish_log (post_id, post_title, action, from_status, to_status, actor_id, note)
    values (new.id, new.title, 'status_changed', old.status, new.status, auth.uid(), 'Changed outside the content workflow (e.g. Blog editor)');
  end if;
  return null;
end
$function$;

drop trigger if exists log_blog_post_status on public.blog_posts;
create trigger log_blog_post_status
  after insert or update on public.blog_posts
  for each row execute function public.log_blog_post_status();

-- 6. The only way the Content section changes workflow status --------------
create or replace function public.content_apply_action(
  p_post_id       uuid,
  p_action        text,
  p_actor_id      uuid,
  p_note          text default null,
  p_scheduled_for timestamptz default null
)
returns public.blog_posts
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur  public.blog_posts;
  next text;
  result public.blog_posts;
begin
  select * into cur from public.blog_posts where id = p_post_id for update;
  if not found then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;

  next := case
    when p_action = 'submit'          and cur.status in ('idea', 'draft', 'rejected')        then 'in_review'
    when p_action = 'approve'         and cur.status = 'in_review'                           then 'approved'
    when p_action = 'reject'          and cur.status in ('in_review', 'approved', 'scheduled') then 'rejected'
    when p_action = 'schedule'        and cur.status = 'approved'                            then 'scheduled'
    when p_action = 'unschedule'      and cur.status = 'scheduled'                           then 'approved'
    when p_action = 'return_to_draft' and cur.status in ('idea', 'in_review', 'approved', 'rejected') then 'draft'
    else null
  end;

  if next is null then
    raise exception 'Cannot % an article that is %', p_action, cur.status using errcode = '22023';
  end if;
  if p_action = 'reject' and coalesce(btrim(p_note), '') = '' then
    raise exception 'A reason is required to reject an article' using errcode = '22023';
  end if;
  if p_action = 'schedule' and (p_scheduled_for is null or p_scheduled_for <= now()) then
    raise exception 'Choose a future publishing time' using errcode = '22023';
  end if;
  if p_action in ('submit', 'approve', 'schedule')
     and (coalesce(btrim(cur.title), '') = '' or coalesce(btrim(cur.body), '') = '') then
    raise exception 'An article needs a title and body before it can be %',
      case p_action when 'submit' then 'sent for approval' when 'approve' then 'approved' else 'scheduled' end
      using errcode = '22023';
  end if;

  perform set_config('listworx.content_logged', 'on', true);

  update public.blog_posts
     set status        = next,
         scheduled_for = case when next = 'scheduled' then p_scheduled_for else null end,
         updated_at    = now()
   where id = p_post_id
  returning * into result;

  insert into public.content_publish_log (post_id, post_title, action, from_status, to_status, actor_id, note)
  values (p_post_id, cur.title, p_action, cur.status, next, p_actor_id, nullif(btrim(p_note), ''));

  perform set_config('listworx.content_logged', 'off', true);
  return result;
end
$function$;

revoke all on function public.content_apply_action(uuid, text, uuid, text, timestamptz) from public, anon, authenticated;
grant execute on function public.content_apply_action(uuid, text, uuid, text, timestamptz) to service_role;
revoke all on function public.sync_blog_post_status() from public, anon, authenticated;
revoke all on function public.log_blog_post_status() from public, anon, authenticated;

commit;
