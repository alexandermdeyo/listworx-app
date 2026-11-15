-- ============================================================================
-- PROPOSED — Stage 1B: per-article featured ("hero") image display settings.
-- TEST only until the owner approves. Requires 20261115000100_content_workflow.sql.
--
-- Adds optional display settings to blog_posts. Existing articles get NULL focus
-- (= the upper-weighted default), fit 'auto', and unknown size (measured in the
-- browser). No article text, URL, image or SEO field is changed.
-- ============================================================================
begin;

alter table public.blog_posts
  add column if not exists featured_image_focus_x smallint,
  add column if not exists featured_image_focus_y smallint,
  add column if not exists featured_image_fit     text not null default 'auto',
  add column if not exists featured_image_width   integer,
  add column if not exists featured_image_height  integer;

alter table public.blog_posts
  add constraint blog_posts_image_focus_x_range check (featured_image_focus_x is null or featured_image_focus_x between 0 and 100),
  add constraint blog_posts_image_focus_y_range check (featured_image_focus_y is null or featured_image_focus_y between 0 and 100),
  add constraint blog_posts_image_fit_check     check (featured_image_fit in ('auto', 'cover', 'contain')),
  add constraint blog_posts_image_size_check    check (
    (featured_image_width is null or featured_image_width between 1 and 20000)
    and (featured_image_height is null or featured_image_height between 1 and 20000)
  );

comment on column public.blog_posts.featured_image_focus_x is 'Hero focus point, % from left (CSS object-position). NULL = default.';
comment on column public.blog_posts.featured_image_focus_y is 'Hero focus point, % from top (CSS object-position). NULL = default (upper-weighted).';
comment on column public.blog_posts.featured_image_fit is 'auto | cover (fill banner, trim edges) | contain (whole photo).';

commit;
