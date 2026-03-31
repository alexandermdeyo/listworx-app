/*
  # Add Contractor Purchases and Admin CRM Features

  1. New Tables
    - `contractor_purchases`
      - `id` (uuid, primary key)
      - `contractor_id` (uuid, references contractor_profiles)
      - `purchase_type` (text - badge, decal, marketing_kit, etc.)
      - `item_name` (text)
      - `quantity` (integer)
      - `price` (numeric)
      - `status` (text - pending, completed, shipped, delivered)
      - `notes` (text)
      - `purchased_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Updates
    - Add `archived` boolean to job_requests
    - Add `archived` boolean to contractor_applications
    - Add `archived` boolean to contractor_profiles
    - Add `last_contacted_at` to realtor_profiles
    - Add `notes` to realtor_profiles for admin notes

  3. Security
    - Enable RLS on contractor_purchases
    - Add policies for admin access
*/

-- Create contractor_purchases table
CREATE TABLE IF NOT EXISTS contractor_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  purchase_type text NOT NULL CHECK (purchase_type IN ('badge', 'decal', 'marketing_kit', 'business_cards', 'yard_sign', 'vehicle_magnet', 'other')),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'shipped', 'delivered', 'cancelled')),
  notes text,
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add archived columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'archived'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_applications' AND column_name = 'archived'
  ) THEN
    ALTER TABLE contractor_applications ADD COLUMN archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'archived'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN archived boolean DEFAULT false;
  END IF;
END $$;

-- Add admin tracking columns to realtor_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtor_profiles' AND column_name = 'last_contacted_at'
  ) THEN
    ALTER TABLE realtor_profiles ADD COLUMN last_contacted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtor_profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE realtor_profiles ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtor_profiles' AND column_name = 'archived'
  ) THEN
    ALTER TABLE realtor_profiles ADD COLUMN archived boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_purchases_contractor_id ON contractor_purchases(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_purchases_status ON contractor_purchases(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_archived ON job_requests(archived);
CREATE INDEX IF NOT EXISTS idx_contractor_applications_archived ON contractor_applications(archived);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_archived ON contractor_profiles(archived);
CREATE INDEX IF NOT EXISTS idx_realtor_profiles_archived ON realtor_profiles(archived);

-- Enable RLS
ALTER TABLE contractor_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do anything with purchases
CREATE POLICY "Admins have full access to contractor purchases"
  ON contractor_purchases FOR ALL
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

-- Policy: Contractors can view their own purchases
CREATE POLICY "Contractors can view their purchases"
  ON contractor_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = contractor_purchases.contractor_id
      AND contractor_profiles.user_id = auth.uid()
    )
  );