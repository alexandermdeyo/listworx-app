/*
  # Create Contact Submissions Table

  1. New Tables
    - `contact_submissions`
      - `id` (uuid, primary key)
      - `name` (text, required) - Name of person submitting
      - `email` (text, required) - Contact email
      - `phone` (text, optional) - Contact phone number
      - `message` (text, required) - Message content
      - `created_at` (timestamptz) - Submission timestamp
      - `status` (text) - Status: 'new', 'read', 'responded', 'archived'
      - `admin_notes` (text, optional) - Internal notes from admin

  2. Security
    - Enable RLS on `contact_submissions` table
    - Allow anyone to insert (submit contact form)
    - Admins can read/update (relies on auth.uid() being admin)
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'archived')),
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact form
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can view all submissions (authenticated users only)
CREATE POLICY "Authenticated users can view submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can update submissions (authenticated users only)
CREATE POLICY "Authenticated users can update submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
