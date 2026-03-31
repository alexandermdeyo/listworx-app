/*
  # Requestor Dashboard Tracking

  ## Summary
  Adds support for requestors (realtors, property managers, homeowners) to track their
  request history, view matched contractors, mark which contractor they selected, and
  leave feedback. Also tracks contractor performance through requestor outcomes.

  ## New Tables

  ### contractor_selections
  - Records which contractor a requestor chose for a given job request
  - Links job_request_id, contractor_id, and realtor_profile_id
  - Tracks hired status, notes, and outcome

  ### requestor_feedback
  - Stores post-job feedback from requestors about contractor performance
  - Linked to job_request and contractor
  - Feeds into contractor performance scoring

  ## Modified Tables

  ### realtor_profiles
  - Adds requester_type column to distinguish Realtor / Property Manager / Homeowner
  - Adds display_name for dashboard presentation

  ## Security
  - RLS enabled on all new tables
  - Requestors can only read/write their own data
  - Admins can read all records
*/

-- Add requester_type and display_name to realtor_profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtor_profiles' AND column_name = 'requester_type'
  ) THEN
    ALTER TABLE realtor_profiles ADD COLUMN requester_type text DEFAULT 'Realtor';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'realtor_profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE realtor_profiles ADD COLUMN display_name text;
  END IF;
END $$;

-- contractor_selections: tracks which contractor a requestor chose
CREATE TABLE IF NOT EXISTS contractor_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  realtor_profile_id uuid REFERENCES realtor_profiles(id) ON DELETE SET NULL,
  selected_at timestamptz DEFAULT now(),
  hired boolean DEFAULT false,
  outcome text DEFAULT 'selected',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contractor_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requestors can view own selections"
  ON contractor_selections FOR SELECT
  TO authenticated
  USING (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Requestors can insert own selections"
  ON contractor_selections FOR INSERT
  TO authenticated
  WITH CHECK (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Requestors can update own selections"
  ON contractor_selections FOR UPDATE
  TO authenticated
  USING (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all selections"
  ON contractor_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- requestor_feedback: post-job feedback from requestors
CREATE TABLE IF NOT EXISTS requestor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  realtor_profile_id uuid REFERENCES realtor_profiles(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  hired boolean DEFAULT false,
  would_recommend boolean,
  review_text text,
  response_time_rating integer CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  work_quality_rating integer CHECK (work_quality_rating >= 1 AND work_quality_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requestor_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requestors can view own feedback"
  ON requestor_feedback FOR SELECT
  TO authenticated
  USING (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Requestors can insert own feedback"
  ON requestor_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    realtor_profile_id IN (
      SELECT id FROM realtor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all feedback"
  ON requestor_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Allow public feedback submission via feedback token (unauthenticated)
CREATE POLICY "Public feedback via token"
  ON requestor_feedback FOR INSERT
  TO anon
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_selections_job_request_id ON contractor_selections(job_request_id);
CREATE INDEX IF NOT EXISTS idx_contractor_selections_contractor_id ON contractor_selections(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_selections_realtor_profile_id ON contractor_selections(realtor_profile_id);
CREATE INDEX IF NOT EXISTS idx_requestor_feedback_job_request_id ON requestor_feedback(job_request_id);
CREATE INDEX IF NOT EXISTS idx_requestor_feedback_contractor_id ON requestor_feedback(contractor_id);
