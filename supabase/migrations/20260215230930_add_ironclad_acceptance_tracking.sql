/*
  # Add IronClad Agreement Tracking

  ## Overview
  Adds fields to track contractor acceptance of the IronClad Standards agreement,
  including acceptance status, timestamp, and version tracking.

  ## Changes
  1. Add ironclad_accepted (boolean) - Whether contractor accepted IronClad Standards
  2. Add ironclad_accepted_at (timestamptz) - When the agreement was accepted
  3. Add ironclad_agreement_version (text) - Version of agreement accepted (e.g., "v1.0")
  
  ## Security
  All new fields are added to existing RLS policies automatically
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'ironclad_accepted'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN ironclad_accepted BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'ironclad_accepted_at'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN ironclad_accepted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'ironclad_agreement_version'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN ironclad_agreement_version TEXT;
  END IF;
END $$;
