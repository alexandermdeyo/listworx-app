/*
  # Create media_items table

  ## Summary
  Adds a media library to support website content management for YouTube videos,
  Instagram/Facebook links, and uploaded media assets.

  ## New Tables
  - `media_items`
    - `id` (uuid, primary key)
    - `title` (text, required) — display title for the item
    - `platform` (text) — source platform: 'youtube', 'instagram', 'facebook', 'upload', 'other'
    - `url` (text, required) — link or embed URL
    - `thumbnail_url` (text, nullable) — optional custom thumbnail override
    - `description` (text, nullable) — optional short description shown on the media page
    - `is_featured` (boolean, default false) — controls display on homepage / featured sections
    - `display_order` (integer, default 0) — controls sort order on public pages
    - `is_active` (boolean, default true) — soft-delete / draft toggle
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on `media_items`
  - Public SELECT policy for active items only
  - Admin INSERT/UPDATE/DELETE policy using app_metadata role check

  ## Notes
  - Admins write through service-role API routes (no client-side RLS bypass needed)
  - Public pages only see `is_active = true` items
  - `display_order` allows manual curation of order without re-dating items
*/

CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'other',
  url text NOT NULL DEFAULT '',
  thumbnail_url text,
  description text,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active media items"
  ON media_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert media items"
  ON media_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update media items"
  ON media_items
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete media items"
  ON media_items
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE INDEX IF NOT EXISTS media_items_is_featured_idx ON media_items (is_featured) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS media_items_display_order_idx ON media_items (display_order);
CREATE INDEX IF NOT EXISTS media_items_platform_idx ON media_items (platform);
