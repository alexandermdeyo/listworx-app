/*
  # Create blog_posts table

  ## Summary
  Adds a blog system to support SEO, credibility content, and authority building
  for ListWorx. Posts can be drafted, published, and unpublished by admins.

  ## New Tables
  - `blog_posts`
    - `id` (uuid, primary key)
    - `title` (text, required) — post headline
    - `slug` (text, unique, required) — URL-safe identifier for routing e.g. "how-to-choose-a-contractor"
    - `excerpt` (text, nullable) — short summary for listing page and meta description
    - `body` (text, nullable) — full post content (plain text or markdown)
    - `featured_image_url` (text, nullable) — optional hero image URL
    - `author_name` (text, default 'ListWorx Team') — byline display
    - `is_published` (boolean, default false) — draft/published toggle
    - `published_at` (timestamptz, nullable) — set when first published
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on `blog_posts`
  - Public SELECT for published posts only (is_published = true)
  - Admin-only INSERT/UPDATE/DELETE using app_metadata role check

  ## Notes
  - Slug must be unique — enforced at DB level
  - Admins use service-role API routes so no client-side RLS bypass needed
  - published_at is set automatically on first publish via API logic
*/

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  excerpt text,
  body text,
  featured_image_url text,
  author_name text NOT NULL DEFAULT 'ListWorx Team',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_unique UNIQUE (slug)
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can insert blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update blog posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (is_published, published_at DESC);
