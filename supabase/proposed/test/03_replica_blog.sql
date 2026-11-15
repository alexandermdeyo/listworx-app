-- blog_posts as in production (read-only check 2026-11-14): columns, RLS policies.
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  featured_image_url text,
  author_name text default 'ListWorx Team',
  is_draft boolean default true,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.blog_posts enable row level security;
grant select on public.blog_posts to anon, authenticated;
grant all on public.blog_posts to authenticated, service_role;
create policy blog_posts_admin_all on public.blog_posts for all to authenticated using (is_admin()) with check (is_admin());
create policy blog_posts_public_read_published on public.blog_posts for select to anon, authenticated using (is_draft = false);
insert into public.blog_posts (id, title, slug, body, is_draft, published_at) values
  ('b0000000-0000-4000-8000-000000000001', 'Published Post', 'published-post', 'Live body.', false, now() - interval '3 days'),
  ('b0000000-0000-4000-8000-000000000002', 'Old Draft', 'old-draft', 'Draft body.', true, null);
insert into public.users (id, role, name, email) values
  ('a0000000-0000-4000-8000-0000000000ad', 'ADMIN', 'Admin', 'admin@example.com'),
  ('a0000000-0000-4000-8000-0000000000c1', 'CONTRACTOR', 'Contractor', 'c@example.com')
on conflict (id) do nothing;
