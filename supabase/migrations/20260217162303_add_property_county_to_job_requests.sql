/*
  # Add Property County to Job Requests

  ## Overview
  Adds property_county field to job_requests table to enable county-based contractor matching.
  This is critical for the matching algorithm which needs to match contractors based on:
  1. Service type (category)
  2. County/location
  3. Tier (priority)

  ## Changes
  1. New Columns
    - `property_county` (text, not null) - The county where the property is located

  ## Notes
  - This field will be used in conjunction with contractors' service_area_counties for matching
  - Required field to ensure accurate contractor routing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'property_county'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN property_county TEXT NOT NULL DEFAULT '';
  END IF;
END $$;