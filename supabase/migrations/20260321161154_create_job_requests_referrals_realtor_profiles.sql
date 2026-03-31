
/*
  # Create Job Requests, Realtor Profiles, and Referrals Tables

  ## Summary
  Creates the core referral tracking infrastructure for the ListWorx platform.

  ## New Tables

  ### realtor_profiles
  - Stores homeowners, realtors, and property managers who submit service requests
  - Links to the users table via user_id
  - Fields: brokerage_name, license_number, contact preferences

  ### job_requests
  - Records each service request submitted via the /request form
  - Tracks requester info, property location, urgency, description, and status
  - Contains a feedback_token for QA email flow
  - Linked to realtor_profiles (optional - can be anonymous)

  ### job_request_categories
  - Junction table: many-to-many between job_requests and categories

  ### referrals
  - One row per contractor selected for a job request
  - Tracks: slot position (1-3), tier at time of referral, email sent status,
    requester contact status, sent timestamp
  - This is the canonical table for lead counts and dashboard data

  ## Changes to contractor_profiles
  - Adds last_sent_at (timestamp of most recent referral)
  - Adds total_referrals_sent (running count)

  ## Security
  - RLS enabled on all tables
  - Contractors can view their own referrals only
  - Admins can view all
  - Public insert allowed for job_requests (unauthenticated form submission)
  - Service role bypasses RLS for backend writes
*/

-- ============================================================
-- REALTOR PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS realtor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  brokerage_name text NOT NULL DEFAULT '',
  license_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE realtor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtors can read own profile"
  ON realtor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage realtor profiles"
  ON realtor_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update realtor profiles"
  ON realtor_profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- JOB REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid REFERENCES realtor_profiles(id) ON DELETE SET NULL,
  county_id uuid REFERENCES counties(id) ON DELETE SET NULL,

  -- Requester contact info (denormalized for history)
  requester_name text NOT NULL DEFAULT '',
  requester_email text NOT NULL DEFAULT '',
  requester_phone text NOT NULL DEFAULT '',
  requester_type text NOT NULL DEFAULT 'Homeowner',

  -- Property location
  property_address text NOT NULL DEFAULT '',
  property_city text NOT NULL DEFAULT '',
  property_state text NOT NULL DEFAULT '',
  property_county text NOT NULL DEFAULT '',
  property_zip text NOT NULL DEFAULT '',

  -- Job details
  job_description text NOT NULL DEFAULT '',
  urgency text NOT NULL DEFAULT 'standard',

  -- Status lifecycle: PENDING → ASSIGNED → CLOSED
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ASSIGNED', 'CLOSED', 'NO_MATCH')),

  -- Feedback / QA token (unique per request)
  feedback_token text UNIQUE,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Unauthenticated users (anonymous form submissions) can insert
CREATE POLICY "Anyone can create job requests"
  ON job_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role can manage job requests"
  ON job_requests FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update job requests"
  ON job_requests FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read job requests linked to their realtor profile
CREATE POLICY "Realtors can read own job requests"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM realtor_profiles rp
      WHERE rp.id = job_requests.realtor_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_job_requests_realtor_id ON job_requests(realtor_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_county_id ON job_requests(county_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_created_at ON job_requests(created_at DESC);

-- ============================================================
-- JOB REQUEST CATEGORIES (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_request_id, category_id)
);

ALTER TABLE job_request_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage job request categories"
  ON job_request_categories FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read job request categories"
  ON job_request_categories FOR SELECT
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_jrc_job_request_id ON job_request_categories(job_request_id);
CREATE INDEX IF NOT EXISTS idx_jrc_category_id ON job_request_categories(category_id);

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core FKs
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,

  -- Tracking fields
  slot_position integer NOT NULL DEFAULT 1
    CHECK (slot_position BETWEEN 1 AND 3),
  tier_at_referral text NOT NULL DEFAULT 'Basic',
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SENT', 'VIEWED', 'CONTACTED', 'CLOSED', 'EXPIRED')),
  email_sent boolean NOT NULL DEFAULT false,
  email_sent_at timestamptz,
  requester_contacted boolean NOT NULL DEFAULT false,
  requester_contacted_at timestamptz,
  expires_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(job_request_id, contractor_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Contractors can only read their own referrals
CREATE POLICY "Contractors can read own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles cp
      WHERE cp.id = referrals.contractor_id
      AND cp.user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role can manage referrals"
  ON referrals FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update referrals"
  ON referrals FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can read referrals"
  ON referrals FOR SELECT
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_referrals_contractor_id ON referrals(contractor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_job_request_id ON referrals(job_request_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================================
-- ADD TRACKING COLUMNS TO contractor_profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'last_sent_at'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN last_sent_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'total_referrals_sent'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN total_referrals_sent integer NOT NULL DEFAULT 0;
  END IF;
END $$;
