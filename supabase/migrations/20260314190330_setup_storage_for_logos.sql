/*
  # Setup Storage Policies for Logos Bucket

  1. Changes
    - Adds RLS policies for contractor logo uploads
    - Note: Bucket must be created via Supabase Dashboard first

  2. Instructions
    - Create 'logos' bucket in Supabase Dashboard
    - Set bucket to public
    - File size limit: 5MB
    - Allowed types: image/jpeg, image/png, image/webp, image/gif

  3. Security
    - Only authenticated users can upload
    - Public read access for displaying logos
*/

-- Note: Run these policies after creating the 'logos' bucket in the dashboard
-- The bucket creation itself must be done via the Supabase Dashboard Storage section

-- Policy: Allow authenticated users to upload logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Contractors can upload own logo'
  ) THEN
    -- This will only work after bucket is created via dashboard
    EXECUTE 'CREATE POLICY "Contractors can upload own logo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = ''logos'')';
  END IF;
END $$;

-- Policy: Allow users to update logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Contractors can update own logo'
  ) THEN
    EXECUTE 'CREATE POLICY "Contractors can update own logo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = ''logos'')
    WITH CHECK (bucket_id = ''logos'')';
  END IF;
END $$;

-- Policy: Allow users to delete logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Contractors can delete own logo'
  ) THEN
    EXECUTE 'CREATE POLICY "Contractors can delete own logo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = ''logos'')';
  END IF;
END $$;

-- Policy: Allow public to view all logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view logos'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = ''logos'')';
  END IF;
END $$;
