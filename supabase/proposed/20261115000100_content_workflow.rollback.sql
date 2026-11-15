-- ROLLBACK for 20261115000100_content_workflow.sql.
-- Removes the workflow additions and returns blog_posts to its previous shape.
-- Article text, slugs, images, is_draft and published_at are kept, so every
-- published article stays published and every unpublished one stays a draft.
-- Lost on rollback: workflow status, schedule, SEO title/description, alt text,
-- audience, category, sources, and the content history log.
begin;
drop trigger if exists log_blog_post_status on public.blog_posts;
drop trigger if exists sync_blog_post_status on public.blog_posts;
drop function if exists public.content_apply_action(uuid, text, uuid, text, timestamptz);
drop function if exists public.log_blog_post_status();
drop function if exists public.sync_blog_post_status();
drop table if exists public.content_publish_log;
drop table if exists public.automation_settings;
drop index if exists public.blog_posts_scheduled_due_idx;
drop index if exists public.blog_posts_status_idx;
alter table public.blog_posts
  drop constraint if exists blog_posts_status_check,
  drop constraint if exists blog_posts_audience_check,
  drop constraint if exists blog_posts_scheduled_needs_time,
  drop constraint if exists blog_posts_sources_is_array,
  drop constraint if exists blog_posts_seo_title_length,
  drop constraint if exists blog_posts_meta_description_length,
  drop column if exists status,
  drop column if exists scheduled_for,
  drop column if exists seo_title,
  drop column if exists meta_description,
  drop column if exists featured_image_alt,
  drop column if exists audience,
  drop column if exists category,
  drop column if exists sources;
commit;
