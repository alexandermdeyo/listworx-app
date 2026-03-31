/*
  # Add Missing Contractor Profile Fields

  1. Changes
    - Add bio, service_area_state fields to contractor_profiles
    - Add agreed_to fields for terms acceptance
    - Add license and insurance expiration dates
    - Create contractor_applications table

  2. Security
    - Maintains existing RLS policies
*/

-- Add missing columns to contractor_profiles
ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS service_area_state text,
  ADD COLUMN IF NOT EXISTS agreed_to_standards boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_to_communications boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_to_privacy_policy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_expiration_date date,
  ADD COLUMN IF NOT EXISTS insurance_expiration_date date;

-- Create contractor_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS contractor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text NOT NULL,
  owner_name text NOT NULL,
  phone text,
  website text,
  bio text,
  primary_state text NOT NULL,
  license_number text,
  license_expiration_date date,
  insurance_expiration_date date,
  license_document_url text,
  insurance_document_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  agreed_to_standards boolean DEFAULT false,
  agreed_to_communications boolean DEFAULT false,
  agreed_to_privacy_policy boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can submit application" ON contractor_applications;
DROP POLICY IF EXISTS "Applicants view own applications" ON contractor_applications;
DROP POLICY IF EXISTS "Admins view all applications" ON contractor_applications;
DROP POLICY IF EXISTS "Admins update applications" ON contractor_applications;
DROP POLICY IF EXISTS "Admins delete applications" ON contractor_applications;

-- Create policies
CREATE POLICY "Anyone can submit application"
  ON contractor_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Applicants view own applications"
  ON contractor_applications FOR SELECT
  TO authenticated
  USING (email = (SELECT auth.email()));

CREATE POLICY "Admins view all applications"
  ON contractor_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins update applications"
  ON contractor_applications FOR UPDATE
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

CREATE POLICY "Admins delete applications"
  ON contractor_applications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Create junction tables for application data
CREATE TABLE IF NOT EXISTS application_counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES contractor_applications(id) ON DELETE CASCADE,
  county_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS application_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES contractor_applications(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE application_counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view application counties" ON application_counties;
DROP POLICY IF EXISTS "Anyone can view application categories" ON application_categories;

CREATE POLICY "Anyone can view application counties"
  ON application_counties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view application categories"
  ON application_categories FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_applications_email ON contractor_applications(email);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_status ON contractor_applications(status);
