/*
  # Create Contractor Uploads Storage Bucket

  ## Overview
  This migration creates a Supabase Storage bucket for contractor application documents
  (license and insurance proof uploads).

  ## Changes
  
  1. Create 'contractor_uploads' storage bucket
  2. Set up storage policies to allow:
     - Anonymous uploads (for application submissions)
     - Admin access to all files
     - Public read access to uploaded files

  ## Security
  - Allow anonymous INSERT (upload) with file size limits
  - Allow public SELECT (download) for submitted documents
  - Allow admin SELECT/DELETE for management
*/

-- Create contractor_uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor_uploads',
  'contractor_uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to upload files (for application submissions)
CREATE POLICY "Allow anonymous uploads for contractor applications"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'contractor_uploads'
    AND (storage.foldername(name))[1] IN ('licenses', 'insurance')
  );

-- Allow public read access to uploaded files
CREATE POLICY "Public read access to contractor uploads"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'contractor_uploads');

-- Allow authenticated admins to SELECT all files
CREATE POLICY "Admins can view all contractor uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contractor_uploads'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Allow authenticated admins to DELETE files
CREATE POLICY "Admins can delete contractor uploads"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contractor_uploads'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );