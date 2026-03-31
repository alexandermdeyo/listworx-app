/*
  # Create Core ListWorx Schema

  1. New Tables
    - `users` - User accounts (linked to auth.users)
    - `contractor_profiles` - Contractor business profiles
    - `tiers` - Subscription tier definitions  
    - `subscriptions` - Active contractor subscriptions
    - `categories` - Trade categories
    - `counties` - Geographic counties
    - `contractor_categories` - Contractor trade specialties
    - `contractor_counties` - Contractor service areas

  2. Security
    - Enable RLS on all tables
    - Appropriate policies for each table
*/

-- Users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'USER' CHECK (role IN ('USER', 'CONTRACTOR', 'ADMIN')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Contractor profiles table
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  owner_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  website text,
  partner_status text DEFAULT 'PENDING' CHECK (partner_status IN ('PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED')),
  license_number text,
  insurance_verified boolean DEFAULT false,
  license_verified boolean DEFAULT false,
  ironclad_accepted boolean DEFAULT false,
  ironclad_accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own profile"
  ON contractor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Contractors can update own profile"
  ON contractor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved contractors"
  ON contractor_profiles FOR SELECT
  TO anon, authenticated
  USING (partner_status IN ('APPROVED', 'ACTIVE'));

-- Tiers table
CREATE TABLE IF NOT EXISTS tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  monthly_price integer NOT NULL,
  annual_price integer NOT NULL,
  features_json jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiers are publicly readable"
  ON tiers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Insert default tiers
INSERT INTO tiers (name, monthly_price, annual_price, features_json) VALUES
  ('Basic Partner', 19900, 199000, '["IronClad Standards badge", "Profile in contractor directory", "Lead referrals in your market"]'::jsonb),
  ('Preferred Partner', 34900, 359000, '["Everything in Basic", "Priority lead routing", "Enhanced profile placement"]'::jsonb),
  ('Elite Partner', 59900, 599000, '["Everything in Preferred", "Top priority lead routing", "Featured homepage placement"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES tiers(id),
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'PAUSED')),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  billing_period text CHECK (billing_period IN ('monthly', 'annual')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contractors can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (contractor_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()));

-- Categories (trades) table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Counties table
CREATE TABLE IF NOT EXISTS counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, state_code)
);

ALTER TABLE counties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counties are publicly readable"
  ON counties FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Contractor categories junction table
CREATE TABLE IF NOT EXISTS contractor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contractor_id, category_id)
);

ALTER TABLE contractor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contractor categories"
  ON contractor_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Contractor counties junction table
CREATE TABLE IF NOT EXISTS contractor_counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  county_id uuid NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contractor_id, county_id)
);

ALTER TABLE contractor_counties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contractor service areas"
  ON contractor_counties FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_partner_status ON contractor_profiles(partner_status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contractor_id ON subscriptions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_contractor_categories_contractor_id ON contractor_categories(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_counties_contractor_id ON contractor_counties(contractor_id);

-- Enable realtime for contractor_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE contractor_profiles;
