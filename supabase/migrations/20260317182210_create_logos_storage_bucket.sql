/*
  # Create logos storage bucket

  ## Summary
  The "logos" bucket was never created in Supabase Storage — only RLS policies were
  written in a previous migration with a note saying the bucket must be created manually.
  This migration creates the bucket programmatically so the contractor logo upload flow works.

  ## Changes
  - Creates the `logos` storage bucket set to public (required so logo URLs are publicly
    readable for display in the contractor directory and dashboard)
  - Sets a 5 MB file size limit and restricts MIME types to images only
  - Drops and recreates the four RLS policies (upload, update, delete, public read) to
    ensure they reference a bucket that now actually exists and are consistently scoped

  ## Security
  - Authenticated users can INSERT / UPDATE / DELETE only objects in the `logos` bucket
  - The public (anonymous role) can SELECT from the `logos` bucket so logos render in
    the browser without authentication
*/

-- Create the logos bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Drop old policies so we can recreate them cleanly
DROP POLICY IF EXISTS "Contractors can upload own logo" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own logo" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own logo" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

-- Allow authenticated users to upload to the logos bucket
CREATE POLICY "Contractors can upload own logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update objects in the logos bucket
CREATE POLICY "Contractors can update own logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to delete objects in the logos bucket
CREATE POLICY "Contractors can delete own logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos');

-- Allow public (unauthenticated) read access so logos display in the browser
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logos');
