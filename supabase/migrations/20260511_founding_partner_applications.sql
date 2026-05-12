CREATE TABLE IF NOT EXISTS contractor_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text,
  last_name text,
  email text,
  phone text,
  business_name text,
  trade text,
  years_in_business integer,
  primary_county text,
  business_description text,
  ironclad_acknowledged boolean,
  volume_acknowledged boolean,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  notes text
);

CREATE TABLE IF NOT EXISTS founder_spots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade text NOT NULL,
  county text NOT NULL,
  tier text NOT NULL,
  spots_total integer NOT NULL DEFAULT 0,
  spots_filled integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS subscription_tier text,
  ADD COLUMN IF NOT EXISTS founder_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_tier text,
  ADD COLUMN IF NOT EXISTS founder_activation_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS founding_partner_badge boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS years_in_business integer,
  ADD COLUMN IF NOT EXISTS response_time text;
