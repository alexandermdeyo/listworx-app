/*
  # Add Admin RLS Policies for contractor_documents and Storage

  ## Summary
  Extends the existing contractor_documents table and contractor-documents
  storage bucket with read and update policies for admin users. Admin access
  is determined by checking the users table for role = 'ADMIN'.

  ## Changes

  ### contractor_documents table
  - New SELECT policy: admins can read ALL contractor documents
  - New UPDATE policy: admins can update review_status and review_notes on any document

  ### storage.objects (contractor-documents bucket)
  - New SELECT policy: admins can read (generate signed URLs for) all files
    in the contractor-documents bucket

  ## Security Notes
  1. Admin identity is verified via the users table (role = 'ADMIN')
  2. Contractor-side policies are completely unchanged
  3. Storage write access for admins is intentionally omitted — admins only need to view
*/

-- Admin SELECT on contractor_documents
CREATE POLICY "Admins can view all contractor documents"
  ON contractor_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Admin UPDATE on contractor_documents (for review_status / review_notes)
CREATE POLICY "Admins can update contractor document review status"
  ON contractor_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Admin SELECT on storage objects (read any file in contractor-documents bucket)
CREATE POLICY "Admins can read all contractor documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contractor-documents'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );
