/*
  # Create Contractor Applications Table

  1. New Tables
    - `contractor_applications`
      - `id` (uuid, primary key) - Unique identifier for the application
      - `company_name` (text) - Name of the contractor's company
      - `full_name` (text) - Full name of the applicant
      - `email` (text) - Email address for contact
      - `phone` (text) - Phone number for contact
      - `state_id` (uuid, foreign key) - Reference to states table
      - `county_id` (uuid, foreign key) - Reference to counties table
      - `categories` (text array) - List of service categories/trades
      - `business_description` (text) - Description of the contractor's business
      - `license_number` (text, nullable) - Professional license number
      - `insurance_provider` (text, nullable) - Insurance company name
      - `insurance_policy_number` (text, nullable) - Insurance policy number
      - `years_in_business` (integer, nullable) - Years of business operation
      - `website` (text, nullable) - Company website URL
      - `status` (text) - Application status: 'submitted', 'under_review', 'approved', 'rejected'
      - `created_at` (timestamptz) - When the application was submitted
      - `reviewed_at` (timestamptz, nullable) - When the application was reviewed
      - `reviewed_by` (uuid, nullable) - Admin user who reviewed the application
      - `rejection_reason` (text, nullable) - Reason for rejection if applicable
      - `contractor_profile_id` (uuid, nullable) - Link to created profile after approval

  2. Security
    - Enable RLS on `contractor_applications` table
    - Add policy for anonymous and authenticated users to insert applications
    - Add policy for authenticated users to read their own applications (by email)
    - Add policy for admins to read and update all applications

  3. Indexes
    - Index on email for faster lookups
    - Index on status for filtering by application status
    - Index on created_at for sorting
*/

-- Create contractor_applications table
CREATE TABLE IF NOT EXISTS contractor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  state_id uuid NOT NULL REFERENCES states(id),
  county_id uuid NOT NULL REFERENCES counties(id),
  categories text[] NOT NULL DEFAULT '{}',
  business_description text NOT NULL,
  license_number text,
  insurance_provider text,
  insurance_policy_number text,
  years_in_business integer,
  website text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  contractor_profile_id uuid REFERENCES contractor_profiles(id),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (anon and authenticated) to submit applications
CREATE POLICY "Anyone can submit contractor applications"
  ON contractor_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can read their own applications by email
CREATE POLICY "Users can read own applications by email"
  ON contractor_applications
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Admins can read all applications
CREATE POLICY "Admins can read all applications"
  ON contractor_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Policy: Admins can update applications (review, approve, reject)
CREATE POLICY "Admins can update applications"
  ON contractor_applications
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractor_applications_email 
  ON contractor_applications(email);

CREATE INDEX IF NOT EXISTS idx_contractor_applications_status 
  ON contractor_applications(status);

CREATE INDEX IF NOT EXISTS idx_contractor_applications_created_at 
  ON contractor_applications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contractor_applications_state_id 
  ON contractor_applications(state_id);

CREATE INDEX IF NOT EXISTS idx_contractor_applications_county_id 
  ON contractor_applications(county_id);
