-- Step 1: Add user_type to shared requestor table
ALTER TABLE requestor_profiles
  ADD COLUMN IF NOT EXISTS user_type text DEFAULT 'homeowner';

COMMENT ON COLUMN requestor_profiles.user_type IS
  'homeowner | realtor | property_manager';

-- Step 2: Create realtor-specific table
CREATE TABLE IF NOT EXISTS realtor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  brokerage_name text DEFAULT NULL,
  license_number text DEFAULT NULL,
  phone text DEFAULT NULL,
  headshot_url text DEFAULT NULL,
  logo_url text DEFAULT NULL,
  brand_color text DEFAULT '#ff6600',

  stripe_customer_id text DEFAULT NULL,
  stripe_subscription_id text DEFAULT NULL,

  realtor_plan text DEFAULT 'free',
  realtor_plan_interval text DEFAULT NULL,
  realtor_founder boolean DEFAULT false,
  realtor_founder_tier text DEFAULT NULL,
  realtor_founder_activation_paid_at timestamptz DEFAULT NULL,
  subscription_status text DEFAULT 'free',
  subscription_current_period_end timestamptz DEFAULT NULL,

  content_packages_remaining int DEFAULT 0,
  flyers_remaining int DEFAULT 0,
  landing_pages_remaining int DEFAULT 0,
  slideshow_videos_remaining int DEFAULT 0,

  purchased_content_packages int DEFAULT 0,
  purchased_flyers int DEFAULT 0,
  purchased_landing_pages int DEFAULT 0,
  purchased_slideshow_videos int DEFAULT 0,

  UNIQUE(user_id)
);

-- Step 3: Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_realtor_profiles_user_id
  ON realtor_profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_realtor_profiles_stripe_customer_id
  ON realtor_profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_realtor_profiles_stripe_subscription_id
  ON realtor_profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtor_profiles_realtor_plan
  ON realtor_profiles (realtor_plan);

CREATE INDEX IF NOT EXISTS idx_realtor_profiles_subscription_status
  ON realtor_profiles (subscription_status);

-- Step 4: RLS
ALTER TABLE realtor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtors can read own profile"
  ON realtor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Realtors can update own profile"
  ON realtor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Realtors can insert own profile"
  ON realtor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
