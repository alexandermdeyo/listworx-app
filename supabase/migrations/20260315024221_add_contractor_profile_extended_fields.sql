/*
  # Add Extended Contractor Profile Fields

  ## Summary
  Adds missing fields to the contractor_profiles table needed for the full contractor dashboard.

  ## New Columns Added to contractor_profiles
  - `license_expiration_date` (date) – License expiry date for verification
  - `insurance_expiration_date` (date) – Insurance expiry date for verification
  - `workers_comp_insurance` (boolean) – Whether contractor has workers comp coverage
  - `google_business_url` (text) – Google Business profile link for vetting
  - `google_reviews_url` (text) – Google Reviews link for vetting
  - `business_website` (text) – Business website URL
  - `agree_to_ironclad_standards` (boolean) – Agreement to IronClad Standards
  - `agree_to_terms_of_service` (boolean) – Agreement to Terms of Service
  - `agree_to_privacy_policy` (boolean) – Agreement to Privacy Policy
  - `business_description` (text) – Detailed business description
  - `subscription_status` (text) – Current Stripe subscription status
  - `subscription_current_period_end` (timestamptz) – Subscription renewal date

  ## Notes
  - All boolean fields default to false
  - Uses IF NOT EXISTS to safely add columns
  - No existing data is modified
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'license_expiration_date') THEN
    ALTER TABLE contractor_profiles ADD COLUMN license_expiration_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_expiration_date') THEN
    ALTER TABLE contractor_profiles ADD COLUMN insurance_expiration_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'workers_comp_insurance') THEN
    ALTER TABLE contractor_profiles ADD COLUMN workers_comp_insurance boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'google_business_url') THEN
    ALTER TABLE contractor_profiles ADD COLUMN google_business_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'google_reviews_url') THEN
    ALTER TABLE contractor_profiles ADD COLUMN google_reviews_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'business_website') THEN
    ALTER TABLE contractor_profiles ADD COLUMN business_website text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'agree_to_ironclad_standards') THEN
    ALTER TABLE contractor_profiles ADD COLUMN agree_to_ironclad_standards boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'agree_to_terms_of_service') THEN
    ALTER TABLE contractor_profiles ADD COLUMN agree_to_terms_of_service boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'agree_to_privacy_policy') THEN
    ALTER TABLE contractor_profiles ADD COLUMN agree_to_privacy_policy boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'business_description') THEN
    ALTER TABLE contractor_profiles ADD COLUMN business_description text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE contractor_profiles ADD COLUMN subscription_status text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'subscription_current_period_end') THEN
    ALTER TABLE contractor_profiles ADD COLUMN subscription_current_period_end timestamptz;
  END IF;
END $$;
