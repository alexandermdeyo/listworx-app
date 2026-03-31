/*
  # Add matching metadata and extended profile fields

  1. Modified Tables
    - `referrals`
      - `match_score` (numeric) - weighted score used for ranking
      - `match_reason` (text) - explains why this contractor was selected
    - `contractor_profiles`
      - `years_in_business` (integer) - how long the company has been operating
      - `profile_published` (boolean) - admin control for profile visibility
      - `founding_partner` (boolean) - founding partner badge status
      - `founding_partner_at` (timestamptz) - when founding partner was granted
      - `ironclad_certified` (boolean) - IronClad certification status
      - `profile_slug` (text, unique) - URL slug for public profile
      - `total_referrals_received` (integer) - lifetime referral count for rotation fairness

  2. Notes
    - match_score enables weighted tier-based sorting
    - profile_slug enables clean public profile URLs
    - founding_partner is a status layer, not a tier
    - total_referrals_received tracks fairness for rotation within tiers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrals' AND column_name = 'match_score'
  ) THEN
    ALTER TABLE referrals ADD COLUMN match_score numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrals' AND column_name = 'match_reason'
  ) THEN
    ALTER TABLE referrals ADD COLUMN match_reason text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'years_in_business'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN years_in_business integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'profile_published'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN profile_published boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'founding_partner'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN founding_partner boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'founding_partner_at'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN founding_partner_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'ironclad_certified'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN ironclad_certified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'profile_slug'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN profile_slug text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'total_referrals_received'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN total_referrals_received integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referrals_match_score ON referrals (match_score DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_profile_slug ON contractor_profiles (profile_slug) WHERE profile_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_founding_partner ON contractor_profiles (founding_partner) WHERE founding_partner = true;
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_profile_published ON contractor_profiles (profile_published) WHERE profile_published = true;