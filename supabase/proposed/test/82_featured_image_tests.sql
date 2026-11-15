-- Stage 1B: featured image display settings (20261115000300_featured_image_display.sql)

-- C17 existing articles keep their content and get neutral defaults
do $$ begin
  if exists (select 1 from blog_posts where featured_image_focus_x is not null or featured_image_focus_y is not null
             or featured_image_fit <> 'auto' or featured_image_width is not null) then
    raise exception 'C17 existing articles did not get neutral defaults';
  end if;
  if (select string_agg(md5(coalesce(title,'')||coalesce(slug,'')||coalesce(body,'')||coalesce(featured_image_url,'')||is_draft::text), ',' order by id) from blog_posts)
     <> current_setting('c17.before') then
    raise exception 'C17 article content changed';
  end if;
  raise notice 'PASS C17 existing articles unchanged, display settings default';
end $$;

-- C18 valid values accepted; invalid values rejected
do $$ begin
  update blog_posts set featured_image_focus_x = 40, featured_image_focus_y = 10, featured_image_fit = 'contain',
    featured_image_width = 1731, featured_image_height = 909 where slug = 'published-post';
  begin update blog_posts set featured_image_focus_x = 101 where slug = 'published-post'; raise exception 'C18a'; exception when check_violation then null; end;
  begin update blog_posts set featured_image_focus_y = -1 where slug = 'published-post'; raise exception 'C18b'; exception when check_violation then null; end;
  begin update blog_posts set featured_image_fit = 'stretch' where slug = 'published-post'; raise exception 'C18c'; exception when check_violation then null; end;
  begin update blog_posts set featured_image_width = 0 where slug = 'published-post'; raise exception 'C18d'; exception when check_violation then null; end;
  if (select status from blog_posts where slug = 'published-post') <> 'published' then raise exception 'C18 changed status'; end if;
  update blog_posts set featured_image_focus_x = null, featured_image_focus_y = null, featured_image_fit = 'auto',
    featured_image_width = null, featured_image_height = null where slug = 'published-post';
  raise notice 'PASS C18 display settings validated; publishing unaffected';
end $$;

-- C19 the public can read the settings of published articles only (same rule as the article itself)
set role anon;
do $$ begin
  if (select count(*) from blog_posts where featured_image_fit is not null) <> (select count(*) from blog_posts) then raise exception 'C19'; end if;
  if exists (select 1 from blog_posts where is_draft) then raise exception 'C19 anon sees drafts'; end if;
  raise notice 'PASS C19 public sees settings only on published articles';
end $$;
reset role;
