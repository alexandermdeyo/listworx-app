
/*
  # Add Admin Control Columns

  ## Summary
  Adds missing columns needed for the admin control panel, referral management,
  and contractor performance tracking. No tables are dropped or recreated.

  ## Changes

  ### job_requests
  - `archived` (boolean) — soft delete flag for admin archiving
  - `feedback_requested_at` (timestamptz) — tracks when QA feedback email was sent

  ### contractor_profiles
  - `jobs_completed` (integer) — running count of confirmed completed jobs
  - `email_notifications_enabled` (boolean) — admin toggle to pause/resume contractor emails
  - `admin_notes` (text) — internal notes field for admin use

  ### referrals
  - `completed_at` (timestamptz) — timestamp when referral was marked as hired/completed

  ## Security
  No new tables — existing RLS policies apply. Service role can update all columns.
*/

-- ============================================================
-- job_requests — add missing admin fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'archived'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'feedback_requested_at'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN feedback_requested_at timestamptz;
  END IF;
END $$;

-- ============================================================
-- contractor_profiles — add performance + admin control fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'jobs_completed'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN jobs_completed integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'email_notifications_enabled'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN email_notifications_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN admin_notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'archived'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- referrals — add completed_at
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referrals' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE referrals ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Index for archived lookups
CREATE INDEX IF NOT EXISTS idx_job_requests_archived ON job_requests(archived);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_archived ON contractor_profiles(archived);
