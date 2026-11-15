-- ============================================================================
-- PROPOSED — Stage 1B follow-up: record WHO created an article (and who changed
-- its status from the Blog editor). TEST only until the owner approves.
-- Requires 20261115000100_content_workflow.sql.
--
-- The website's admin API writes with the server (service_role) key, so auth.uid()
-- is empty inside the history trigger. After checking that the caller is an
-- admin, the API now sends that admin's id in the request header
-- "x-listworx-actor". content_request_actor() trusts that header ONLY when the
-- request is made with the server key (a signed-in user's own id always wins, and
-- anon/authenticated callers cannot use the header to impersonate anyone).
--
-- Existing history rows are NOT changed: older "created" entries keep an empty
-- actor rather than a guessed one.
-- ============================================================================
begin;

create or replace function public.content_request_actor()
returns uuid
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  claims  text := nullif(current_setting('request.jwt.claims', true), '');
  headers text := nullif(current_setting('request.headers', true), '');
  v       text;
begin
  if auth.uid() is not null then
    return auth.uid();
  end if;
  if claims is null or (claims::jsonb ->> 'role') is distinct from 'service_role' then
    return null;
  end if;
  v := headers::jsonb ->> 'x-listworx-actor';
  if v ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v::uuid;
  end if;
  return null;
exception when others then
  return null; -- malformed settings never block an article save
end
$function$;

revoke all on function public.content_request_actor() from public, anon, authenticated;

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
    values (new.id, new.title, 'created', null, new.status, public.content_request_actor(), null);
  elsif new.status is distinct from old.status then
    insert into public.content_publish_log (post_id, post_title, action, from_status, to_status, actor_id, note)
    values (new.id, new.title, 'status_changed', old.status, new.status, public.content_request_actor(), 'Changed outside the content workflow (e.g. Blog editor)');
  end if;
  return null;
end
$function$;

revoke all on function public.log_blog_post_status() from public, anon, authenticated;

commit;
