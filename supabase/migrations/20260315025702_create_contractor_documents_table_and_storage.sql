/*
  # Create contractor_documents Table and Storage Bucket

  ## Summary
  Creates the infrastructure for contractors to upload, view, and manage their
  compliance documents (Proof of License and Proof of Insurance).

  ## New Table: contractor_documents
  - `id` (uuid, PK) – unique record identifier
  - `contractor_id` (uuid, FK → contractor_profiles.id) – owner of the document
  - `document_type` (text) – one of: 'license', 'insurance'
  - `file_name` (text) – original file name as uploaded
  - `storage_path` (text) – path within the contractor-documents storage bucket
  - `expiration_date` (date, nullable) – pulled from profile fields for display
  - `review_status` (text) – one of: 'pending', 'approved', 'rejected'. Defaults to 'pending'
  - `review_notes` (text, nullable) – admin notes on the review
  - `uploaded_at` (timestamptz) – when the file was uploaded
  - `updated_at` (timestamptz) – last modification time

  ## Security
  - RLS enabled — contractors can only see and manage their own documents
  - Admins (service role) can read/update review status on all documents
  - Storage bucket is private (non-public) — contractors access via signed URLs

  ## Notes
  1. One active document per contractor per document_type — handled by a unique constraint
     on (contractor_id, document_type). On re-upload, the existing row is updated.
  2. Storage bucket 'contractor-documents' is created as private.
  3. Storage RLS policies ensure contractors can only access files under their own user_id prefix.
*/

-- Create the contractor_documents table
CREATE TABLE IF NOT EXISTS contractor_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id     uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  document_type     text NOT NULL CHECK (document_type IN ('license', 'insurance')),
  file_name         text NOT NULL DEFAULT '',
  storage_path      text NOT NULL DEFAULT '',
  expiration_date   date,
  review_status     text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  review_notes      text,
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- One record per document type per contractor
CREATE UNIQUE INDEX IF NOT EXISTS contractor_documents_type_unique
  ON contractor_documents (contractor_id, document_type);

-- Index for fast lookups by contractor
CREATE INDEX IF NOT EXISTS contractor_documents_contractor_id_idx
  ON contractor_documents (contractor_id);

-- Enable RLS
ALTER TABLE contractor_documents ENABLE ROW LEVEL SECURITY;

-- Contractors can SELECT their own documents
CREATE POLICY "Contractors can view own documents"
  ON contractor_documents
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Contractors can INSERT their own documents
CREATE POLICY "Contractors can insert own documents"
  ON contractor_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Contractors can UPDATE their own documents
CREATE POLICY "Contractors can update own documents"
  ON contractor_documents
  FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- Create the private storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-documents',
  'contractor-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: contractors can SELECT (download) files under their own user_id prefix
CREATE POLICY "Contractors can read own documents in storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contractor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: contractors can INSERT files under their own user_id prefix
CREATE POLICY "Contractors can upload own documents in storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contractor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: contractors can UPDATE (replace) files under their own user_id prefix
CREATE POLICY "Contractors can update own documents in storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contractor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: contractors can DELETE their own files (needed for upsert replace flows)
CREATE POLICY "Contractors can delete own documents in storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contractor-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
