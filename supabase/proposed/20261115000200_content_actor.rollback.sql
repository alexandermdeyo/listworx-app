-- Rollback for 20261115000200_content_actor.sql: restore the Stage 1B history
-- trigger (actor = auth.uid() only) and drop the helper. History rows are kept.
begin;

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

revoke all on function public.log_blog_post_status() from public, anon, authenticated;
drop function if exists public.content_request_actor();

commit;
