/*
  # Fix missing blog/media tables and align schema + RLS

  Safe, isolated migration for blog/media features only.
  - Ensures public.blog_posts exists with expected columns (including is_draft)
  - Ensures public.media_items exists with expected columns
  - Adds/repairs RLS for admin read/write + public read where appropriate
*/

-- Ensure required extension for UUID defaults
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------
-- BLOG POSTS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text,
  featured_image_url text,
  author_name text,
  is_draft boolean NOT NULL DEFAULT true,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS is_draft boolean,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

ALTER TABLE public.blog_posts
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN is_draft SET DEFAULT true,
  ALTER COLUMN is_draft SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

-- Backfill compatibility when legacy is_published exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_posts'
      AND column_name = 'is_published'
  ) THEN
    UPDATE public.blog_posts
    SET is_draft = NOT COALESCE(is_published, false)
    WHERE is_draft IS NULL;
  END IF;
END $$;

UPDATE public.blog_posts
SET is_draft = true
WHERE is_draft IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx ON public.blog_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS blog_posts_is_draft_idx ON public.blog_posts (is_draft);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_public_read_published" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_select" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_update" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_admin_delete" ON public.blog_posts;

CREATE POLICY "blog_posts_public_read_published"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_draft = false);

CREATE POLICY "blog_posts_admin_select"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "blog_posts_admin_insert"
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_posts_admin_update"
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "blog_posts_admin_delete"
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------
-- MEDIA ITEMS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  description text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_featured boolean,
  ADD COLUMN IF NOT EXISTS display_order integer,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

ALTER TABLE public.media_items
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN platform SET NOT NULL,
  ALTER COLUMN url SET NOT NULL,
  ALTER COLUMN is_featured SET DEFAULT false,
  ALTER COLUMN is_featured SET NOT NULL,
  ALTER COLUMN display_order SET DEFAULT 0,
  ALTER COLUMN display_order SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_platform_check;

ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_platform_check
  CHECK (platform IN ('youtube', 'instagram', 'facebook', 'upload', 'link'));

CREATE INDEX IF NOT EXISTS media_items_active_order_idx ON public.media_items (is_active, display_order, created_at DESC);
CREATE INDEX IF NOT EXISTS media_items_featured_active_idx ON public.media_items (is_featured) WHERE is_active = true;

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active media items" ON public.media_items;
DROP POLICY IF EXISTS "Admins can insert media items" ON public.media_items;
DROP POLICY IF EXISTS "Admins can update media items" ON public.media_items;
DROP POLICY IF EXISTS "Admins can delete media items" ON public.media_items;
DROP POLICY IF EXISTS "media_items_public_read_active" ON public.media_items;
DROP POLICY IF EXISTS "media_items_admin_select" ON public.media_items;
DROP POLICY IF EXISTS "media_items_admin_insert" ON public.media_items;
DROP POLICY IF EXISTS "media_items_admin_update" ON public.media_items;
DROP POLICY IF EXISTS "media_items_admin_delete" ON public.media_items;

CREATE POLICY "media_items_public_read_active"
  ON public.media_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "media_items_admin_select"
  ON public.media_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "media_items_admin_insert"
  ON public.media_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "media_items_admin_update"
  ON public.media_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "media_items_admin_delete"
  ON public.media_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
