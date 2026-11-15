-- Stage 1B follow-up: creator / actor recorded in history (20261115000200_content_actor.sql)
-- Runs after 80_content_workflow_tests.sql on the same database.

-- C12 history rows written before this migration are left exactly as they were
do $$ begin
  if (select count(*) from content_publish_log where action = 'created' and actor_id is not null)
     <> (select (current_setting('c12.before'))::int) then
    raise exception 'C12 existing created rows were changed';
  end if;
  raise notice 'PASS C12 existing history untouched (no invented creators)';
end $$;

-- C13 server key + verified admin header -> creator recorded on insert
set role service_role;
select null from set_config('request.jwt.claims', '{"role":"service_role"}', false);
select null from set_config('request.headers', '{"x-listworx-actor":"a0000000-0000-4000-8000-0000000000ad"}', false);
insert into blog_posts (id, title, slug, body) values ('c1300000-0000-4000-8000-000000000001', 'C13', 'c13', 'x');
reset role;
do $$ begin
  if (select actor_id from content_publish_log where post_id = 'c1300000-0000-4000-8000-000000000001' and action = 'created')
     is distinct from 'a0000000-0000-4000-8000-0000000000ad'::uuid then
    raise exception 'C13 creator not recorded';
  end if;
  raise notice 'PASS C13 creator recorded for server-side creation';
end $$;

-- C14 Blog editor publish toggle (server key + header) records who changed the status
set role service_role;
update blog_posts set is_draft = false where id = 'c1300000-0000-4000-8000-000000000001';
reset role;
do $$ begin
  if (select actor_id from content_publish_log where post_id = 'c1300000-0000-4000-8000-000000000001' and action = 'status_changed')
     is distinct from 'a0000000-0000-4000-8000-0000000000ad'::uuid then
    raise exception 'C14 status change actor not recorded';
  end if;
  raise notice 'PASS C14 Blog editor status change records the admin';
end $$;

-- C15 no header, or a malformed one -> no actor, and the save still succeeds
set role service_role;
select null from set_config('request.headers', '{}', false);
insert into blog_posts (id, title, slug, body) values ('c1500000-0000-4000-8000-000000000001', 'C15a', 'c15a', 'x');
select null from set_config('request.headers', '{"x-listworx-actor":"1; drop table blog_posts"}', false);
insert into blog_posts (id, title, slug, body) values ('c1500000-0000-4000-8000-000000000002', 'C15b', 'c15b', 'x');
select null from set_config('request.headers', 'not json', false);
insert into blog_posts (id, title, slug, body) values ('c1500000-0000-4000-8000-000000000003', 'C15c', 'c15c', 'x');
reset role;
do $$ begin
  if (select count(*) from content_publish_log where post_id::text like 'c1500000%' and action = 'created' and actor_id is null) <> 3 then
    raise exception 'C15 missing or malformed header produced an actor or blocked the save';
  end if;
  raise notice 'PASS C15 missing/malformed header -> no actor, save not blocked';
end $$;

-- C16 the header is ignored for non-server callers; a signed-in user's own id always wins
select null from set_config('request.headers', '{"x-listworx-actor":"a0000000-0000-4000-8000-0000000000ad"}', false);
select null from set_config('request.jwt.claims', '{"role":"anon"}', false);
do $$ begin
  if public.content_request_actor() is not null then raise exception 'C16a anon could use the header'; end if;
end $$;
select null from set_config('request.jwt.claims', '{"role":"authenticated","sub":"a0000000-0000-4000-8000-0000000000c1"}', false);
do $$ begin
  if public.content_request_actor() is distinct from 'a0000000-0000-4000-8000-0000000000c1'::uuid then
    raise exception 'C16b signed-in user could impersonate via header';
  end if;
end $$;
set role authenticated;
do $$ begin
  begin perform public.content_request_actor(); raise exception 'C16c helper callable by users'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select null from set_config('request.jwt.claims', '', false);
select null from set_config('request.headers', '', false);
do $$ begin raise notice 'PASS C16 header honored only for the server key; users cannot impersonate'; end $$;

delete from blog_posts where id::text like 'c1300000%' or id::text like 'c1500000%';
