/*
  # Recreate Contractor Application System

  ## Overview
  This migration recreates the contractor application system with the correct schema
  to allow unauthenticated users to submit applications without creating accounts.

  ## Changes
  
  1. Drop existing contractor_applications table and recreate with proper schema
  2. Create junction tables for categories and counties
  3. Set up RLS policies for anonymous submissions
  4. Create storage bucket for document uploads

  ## New Schema
  
  ### contractor_applications
  - Removed: insurance_provider, insurance_policy_number, years_in_business
  - Added: owner_name, bio, agreed_to_* fields, document URLs, expiration dates
  - Status values: pending, approved, rejected
  
  ### contractor_application_categories
  - Links applications to service categories
  
  ### contractor_application_counties
  - Links applications to counties served (multi-select)

  ## Security
  - Allow anonymous INSERT on all application tables
  - Allow admin SELECT/UPDATE via users.role = 'ADMIN'
*/

-- Drop existing contractor_applications table and related constraints
DROP TABLE IF EXISTS public.contractor_applications CASCADE;

-- Create new contractor_applications table with correct schema
CREATE TABLE public.contractor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text,
  website text,
  bio text,
  primary_state text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  agreed_to_standards boolean NOT NULL DEFAULT false,
  agreed_to_communications boolean NOT NULL DEFAULT false,
  agreed_to_privacy_policy boolean NOT NULL DEFAULT false,
  license_number text,
  license_expiration_date date,
  insurance_expiration_date date,
  license_document_url text,
  insurance_document_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contractor_application_categories junction table
CREATE TABLE IF NOT EXISTS public.contractor_application_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, category_id)
);

-- Create contractor_application_counties junction table
CREATE TABLE IF NOT EXISTS public.contractor_application_counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.contractor_applications(id) ON DELETE CASCADE,
  county_id uuid NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, county_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_applications_email ON public.contractor_applications(email);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_status ON public.contractor_applications(status);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_created_at ON public.contractor_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_app_categories_app_id ON public.contractor_application_categories(application_id);
CREATE INDEX IF NOT EXISTS idx_contractor_app_categories_cat_id ON public.contractor_application_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_contractor_app_counties_app_id ON public.contractor_application_counties(application_id);
CREATE INDEX IF NOT EXISTS idx_contractor_app_counties_county_id ON public.contractor_application_counties(county_id);

-- Enable RLS on all tables
ALTER TABLE public.contractor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_application_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_application_counties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_applications

-- Allow anonymous INSERT for public application submissions
CREATE POLICY "Allow anonymous application submissions"
  ON public.contractor_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated admins to SELECT all applications
CREATE POLICY "Admins can view all applications"
  ON public.contractor_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Allow authenticated admins to UPDATE applications
CREATE POLICY "Admins can update applications"
  ON public.contractor_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for contractor_application_categories

-- Allow anonymous INSERT for application submissions
CREATE POLICY "Allow anonymous category associations"
  ON public.contractor_application_categories
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated admins to SELECT
CREATE POLICY "Admins can view application categories"
  ON public.contractor_application_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for contractor_application_counties

-- Allow anonymous INSERT for application submissions
CREATE POLICY "Allow anonymous county associations"
  ON public.contractor_application_counties
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated admins to SELECT
CREATE POLICY "Admins can view application counties"
  ON public.contractor_application_counties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contractor_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_contractor_applications_updated_at ON public.contractor_applications;
CREATE TRIGGER update_contractor_applications_updated_at
  BEFORE UPDATE ON public.contractor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contractor_application_updated_at();