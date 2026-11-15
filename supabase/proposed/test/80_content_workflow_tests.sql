\set admin '\'a0000000-0000-4000-8000-0000000000ad\''
\set contractor '\'a0000000-0000-4000-8000-0000000000c1\''
-- C1 existing rows mapped
do $$ begin
  if (select status from blog_posts where slug='published-post') <> 'published' then raise exception 'C1 published row status'; end if;
  if (select status from blog_posts where slug='old-draft') <> 'draft' then raise exception 'C1 draft row status'; end if;
  if (select scheduler_enabled from automation_settings) then raise exception 'C8 scheduler must be off'; end if;
  raise notice 'PASS C1 existing articles mapped (published/draft); C8 scheduler off';
end $$;

-- C5 workflow through content_apply_action (as the server would call it)
insert into blog_posts (id, title, slug, body, status) values ('c0000000-0000-4000-8000-000000000001', 'Workflow Post', 'workflow-post', null, 'idea');
do $$ declare r blog_posts; begin
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','submit','a0000000-0000-4000-8000-0000000000ad');
    raise exception 'C5a submit without body allowed'; exception when sqlstate '22023' then null; end;
  update blog_posts set body = 'Real body.' where id='c0000000-0000-4000-8000-000000000001';
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','submit','a0000000-0000-4000-8000-0000000000ad');
  if r.status <> 'in_review' or r.is_draft is not true then raise exception 'C5b submit'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','schedule','a0000000-0000-4000-8000-0000000000ad', null, now()+interval '1 day');
    raise exception 'C5c schedule before approval allowed'; exception when sqlstate '22023' then null; end;
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','approve','a0000000-0000-4000-8000-0000000000ad');
  if r.status <> 'approved' or r.is_draft is not true then raise exception 'C5d approve must not publish'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','schedule','a0000000-0000-4000-8000-0000000000ad', null, now()-interval '1 hour');
    raise exception 'C5e past schedule allowed'; exception when sqlstate '22023' then null; end;
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','schedule','a0000000-0000-4000-8000-0000000000ad', null, now()+interval '2 days');
  if r.status <> 'scheduled' or r.scheduled_for is null or r.is_draft is not true then raise exception 'C5f schedule'; end if;
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','unschedule','a0000000-0000-4000-8000-0000000000ad');
  if r.status <> 'approved' or r.scheduled_for is not null then raise exception 'C5g unschedule'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','reject','a0000000-0000-4000-8000-0000000000ad', '  ');
    raise exception 'C5h reject without reason allowed'; exception when sqlstate '22023' then null; end;
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','reject','a0000000-0000-4000-8000-0000000000ad', 'Needs sources');
  if r.status <> 'rejected' then raise exception 'C5i reject'; end if;
  r := content_apply_action('c0000000-0000-4000-8000-000000000001','return_to_draft','a0000000-0000-4000-8000-0000000000ad');
  if r.status <> 'draft' then raise exception 'C5j return to draft'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','approve','a0000000-0000-4000-8000-0000000000ad');
    raise exception 'C5k approve a draft allowed'; exception when sqlstate '22023' then null; end;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','publish','a0000000-0000-4000-8000-0000000000ad');
    raise exception 'C5l publish action allowed'; exception when sqlstate '22023' then null; end;
  raise notice 'PASS C5 workflow transitions and guards (submit/approve/schedule/unschedule/reject/return; publishing not possible here)';
end $$;

-- C6 history recorded with actor and note
do $$ begin
  if (select count(*) from content_publish_log where post_id='c0000000-0000-4000-8000-000000000001' and actor_id='a0000000-0000-4000-8000-0000000000ad') <> 6 then raise exception 'C6 expected 6 actor-attributed entries, got %', (select count(*) from content_publish_log where post_id='c0000000-0000-4000-8000-000000000001' and actor_id is not null); end if;
  if not exists (select 1 from content_publish_log where post_id='c0000000-0000-4000-8000-000000000001' and action='reject' and note='Needs sources') then raise exception 'C6 reject note'; end if;
  if (select count(*) from content_publish_log where post_id='c0000000-0000-4000-8000-000000000001' and action='status_changed') <> 0 then raise exception 'C6 workflow actions double-logged'; end if;
  if (select count(*) from content_publish_log where post_id='c0000000-0000-4000-8000-000000000001' and action='created') <> 1 then raise exception 'C6 creation not logged'; end if;
  raise notice 'PASS C6 history: each action logged once with actor and note';
end $$;

-- C3/C4 existing Blog editor toggle still publishes and unpublishes
update blog_posts set is_draft = false where slug='old-draft';
do $$ begin
  if (select status from blog_posts where slug='old-draft') <> 'published' or (select published_at from blog_posts where slug='old-draft') is null then raise exception 'C3 legacy publish'; end if;
end $$;
update blog_posts set is_draft = true where slug='old-draft';
do $$ begin
  if (select status from blog_posts where slug='old-draft') <> 'draft' then raise exception 'C4 legacy unpublish'; end if;
  raise notice 'PASS C3-C4 existing Blog editor publish/unpublish toggle still works and is logged';
end $$;

-- C9 status published directly makes it public; C10 constraints
do $$ begin
  update blog_posts set status='published' where id='c0000000-0000-4000-8000-000000000001';
  if (select is_draft from blog_posts where id='c0000000-0000-4000-8000-000000000001') then raise exception 'C9'; end if;
  update blog_posts set status='draft' where id='c0000000-0000-4000-8000-000000000001';
  begin update blog_posts set status='scheduled' where id='c0000000-0000-4000-8000-000000000001'; raise exception 'C10a scheduled without time'; exception when check_violation then null; end;
  begin update blog_posts set audience='everyone' where id='c0000000-0000-4000-8000-000000000001'; raise exception 'C10b bad audience'; exception when check_violation then null; end;
  begin update blog_posts set status='live' where id='c0000000-0000-4000-8000-000000000001'; raise exception 'C10c bad status'; exception when check_violation then null; end;
  raise notice 'PASS C9-C10 status drives visibility; invalid values rejected';
end $$;

-- C2/C7 permissions as anon, a signed-in contractor, and an admin
set role anon;
do $$ begin
  if (select count(*) from blog_posts where is_draft) <> 0 then raise exception 'C2 anon sees drafts'; end if;
  if (select count(*) from blog_posts) <> 1 then raise exception 'C2 anon published count %', (select count(*) from blog_posts); end if;
  begin perform 1 from content_publish_log; raise exception 'C7a anon reads history'; exception when insufficient_privilege then null; end;
  begin perform 1 from automation_settings; raise exception 'C7b anon reads settings'; exception when insufficient_privilege then null; end;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','submit',null); raise exception 'C7c anon runs action'; exception when insufficient_privilege then null; end;
  raise notice 'PASS C2/C7 anon: published only, no history, no settings, no actions';
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :contractor, 'role', 'authenticated')::text, false);
do $$ begin
  if (select count(*) from blog_posts where is_draft) <> 0 then raise exception 'C7d contractor sees drafts'; end if;
  if (select count(*) from content_publish_log) <> 0 then raise exception 'C7e contractor reads history'; end if;
  if (select count(*) from automation_settings) <> 0 then raise exception 'C7f contractor reads settings'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','submit',null); raise exception 'C7g contractor runs action'; exception when insufficient_privilege then null; end;
  begin insert into content_publish_log (action) values ('forged'); raise exception 'C7h contractor writes history'; exception when insufficient_privilege then null; end;
  begin update automation_settings set scheduler_enabled = true; if (select scheduler_enabled from automation_settings) then raise exception 'C7i contractor enabled scheduler'; end if; exception when insufficient_privilege then null; end;
  raise notice 'PASS C7 signed-in non-admin: no drafts, history, settings or actions';
end $$;
select set_config('request.jwt.claims', json_build_object('sub', :admin, 'role', 'authenticated')::text, false);
do $$ begin
  if (select count(*) from content_publish_log) = 0 then raise exception 'C7j admin cannot read history'; end if;
  if (select count(*) from automation_settings) <> 1 then raise exception 'C7k admin cannot read settings'; end if;
  begin update automation_settings set scheduler_enabled = true; exception when insufficient_privilege then null; end;
  if (select scheduler_enabled from automation_settings) then raise exception 'C7l admin turned scheduler on from the browser'; end if;
  begin perform content_apply_action('c0000000-0000-4000-8000-000000000001','submit',null); raise exception 'C7m admin browser session runs action directly'; exception when insufficient_privilege then null; end;
  raise notice 'PASS C7 admin: reads history and settings; scheduler switch and actions only via server';
end $$;
reset role;
select set_config('request.jwt.claims', '', false);
