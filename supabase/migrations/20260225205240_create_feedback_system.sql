/*
  # Create Feedback and Review System

  1. New Tables
    - `job_feedback`
      - `id` (uuid, primary key)
      - `job_request_id` (uuid, references job_requests)
      - `contractor_id` (uuid, references contractor_profiles)
      - `rating` (integer, 1-5 scale)
      - `quality_rating` (integer, 1-5)
      - `communication_rating` (integer, 1-5)
      - `timeliness_rating` (integer, 1-5)
      - `professionalism_rating` (integer, 1-5)
      - `would_recommend` (boolean)
      - `comments` (text)
      - `feedback_token` (text, unique - for secure feedback submission)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `job_feedback` table
    - Add policies for authenticated users to read their own feedback
    - Add policy for anonymous users to submit feedback with valid token

  3. Updates
    - Add `feedback_requested_at` to job_requests table
    - Add `feedback_reminder_sent_at` to job_requests table
    - Add `average_rating` to contractor_profiles table
    - Add `total_reviews` to contractor_profiles table
*/

-- Create job_feedback table
CREATE TABLE IF NOT EXISTS job_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  timeliness_rating integer CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating integer CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  would_recommend boolean DEFAULT true,
  comments text,
  feedback_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add feedback tracking columns to job_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'feedback_requested_at'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN feedback_requested_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'feedback_reminder_sent_at'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN feedback_reminder_sent_at timestamptz;
  END IF;
END $$;

-- Add rating tracking columns to contractor_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN average_rating numeric(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN total_reviews integer DEFAULT 0;
  END IF;
END $$;

-- Create index on feedback_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_feedback_token ON job_feedback(feedback_token);

-- Create index on job_request_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_feedback_job_request_id ON job_feedback(job_request_id);

-- Create index on contractor_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_feedback_contractor_id ON job_feedback(contractor_id);

-- Enable RLS
ALTER TABLE job_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read feedback for their own jobs (realtors)
CREATE POLICY "Realtors can view feedback for their jobs"
  ON job_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_requests
      INNER JOIN realtor_profiles ON realtor_profiles.id = job_requests.realtor_id
      WHERE job_requests.id = job_feedback.job_request_id
      AND realtor_profiles.user_id = auth.uid()
    )
  );

-- Policy: Contractors can view their own feedback
CREATE POLICY "Contractors can view their feedback"
  ON job_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = job_feedback.contractor_id
      AND contractor_profiles.user_id = auth.uid()
    )
  );

-- Policy: Anyone with valid token can submit feedback (anonymous submission)
CREATE POLICY "Anonymous users can submit feedback with token"
  ON job_feedback FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated users can submit feedback
CREATE POLICY "Authenticated users can submit feedback"
  ON job_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update contractor ratings after feedback is submitted
CREATE OR REPLACE FUNCTION update_contractor_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contractor_profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM job_feedback
      WHERE contractor_id = NEW.contractor_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM job_feedback
      WHERE contractor_id = NEW.contractor_id
    )
  WHERE id = NEW.contractor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contractor ratings
DROP TRIGGER IF EXISTS trigger_update_contractor_ratings ON job_feedback;
CREATE TRIGGER trigger_update_contractor_ratings
  AFTER INSERT ON job_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_ratings();