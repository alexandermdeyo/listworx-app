-- Rollback for 20261115000300_featured_image_display.sql: removes the display
-- settings only. Articles, images, URLs and SEO fields are untouched.
begin;

alter table public.blog_posts
  drop constraint if exists blog_posts_image_focus_x_range,
  drop constraint if exists blog_posts_image_focus_y_range,
  drop constraint if exists blog_posts_image_fit_check,
  drop constraint if exists blog_posts_image_size_check;

alter table public.blog_posts
  drop column if exists featured_image_focus_x,
  drop column if exists featured_image_focus_y,
  drop column if exists featured_image_fit,
  drop column if exists featured_image_width,
  drop column if exists featured_image_height;

commit;
