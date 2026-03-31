/*
  # Add Licensing & Insurance Verification Fields

  ## Overview
  Adds required fields for ironclad contractor verification standards including
  license/insurance expiration dates, document uploads, and agreement checkboxes

  ## Changes
  1. Add license_expiration_date to contractor_profiles
  2. Add insurance_expiration_date to contractor_profiles
  3. Add insurance_document_url to contractor_profiles (for uploaded proof)
  4. Add agreed_to_standards to contractor_profiles (IronClad Standards Agreement)
  5. Add agreed_to_communications to contractor_profiles
  6. Add agreed_to_privacy_policy to contractor_profiles
  
  ## Security
  All new fields are added to existing RLS policies automatically
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'license_expiration_date'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN license_expiration_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_expiration_date'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN insurance_expiration_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_document_url'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN insurance_document_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'agreed_to_standards'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN agreed_to_standards BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'agreed_to_communications'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN agreed_to_communications BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'agreed_to_privacy_policy'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN agreed_to_privacy_policy BOOLEAN DEFAULT false;
  END IF;
END $$;
