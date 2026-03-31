/*
  # Add Missing Fields for ListWorx

  ## Overview
  Adds missing fields to contractor_profiles and job_requests tables
  to match the complete specification

  ## Changes
  1. Add website field to contractor_profiles
  2. Add logo_upload field to contractor_profiles
  3. Add urgency_level enum and field to job_requests
  4. Add photos_upload field to job_requests
*/

-- Create urgency level enum
CREATE TYPE urgency_level AS ENUM ('Standard', 'Urgent', 'ASAP');

-- Add missing fields to contractor_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN website TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'logo_upload'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN logo_upload TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'license_number'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN license_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_verified'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN insurance_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add missing fields to job_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'urgency_level'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN urgency_level urgency_level DEFAULT 'Standard';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'photos_upload'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN photos_upload TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN client_type TEXT DEFAULT 'Realtor';
  END IF;
END $$;
