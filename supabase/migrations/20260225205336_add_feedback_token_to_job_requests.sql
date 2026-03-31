/*
  # Add feedback token to job_requests

  1. Updates
    - Add `feedback_token` column to job_requests table for secure feedback links
*/

-- Add feedback_token column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'feedback_token'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN feedback_token text UNIQUE;
  END IF;
END $$;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_requests_feedback_token ON job_requests(feedback_token);