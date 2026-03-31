/*
  # Add Missing Job Request Columns and Junction Table

  1. New Columns
    - `job_requests.requester_type` - Stores "Realtor" or "Homeowner"
    - `job_requests.property_city` - City of the property
    - `job_requests.property_state` - State of the property
    - `job_requests.property_zip` - Zip code of the property

  2. New Table
    - `job_request_categories` - Junction table linking job requests to service categories
  
  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Add missing columns to job_requests (using IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'requester_type'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN requester_type text DEFAULT 'Realtor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'property_city'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN property_city text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'property_state'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN property_state text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'property_zip'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN property_zip text DEFAULT '';
  END IF;
END $$;

-- Create job_request_categories junction table
CREATE TABLE IF NOT EXISTS job_request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(job_request_id, category_id)
);

-- Enable RLS
ALTER TABLE job_request_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read job_request_categories" ON job_request_categories;
DROP POLICY IF EXISTS "Admins can manage job_request_categories" ON job_request_categories;
DROP POLICY IF EXISTS "Service role can manage job_request_categories" ON job_request_categories;

-- RLS Policies for job_request_categories
CREATE POLICY "Public can read job_request_categories"
  ON job_request_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage job_request_categories"
  ON job_request_categories
  FOR ALL
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

CREATE POLICY "Service role can manage job_request_categories"
  ON job_request_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_job_request_categories_job_request_id
  ON job_request_categories(job_request_id);

CREATE INDEX IF NOT EXISTS idx_job_request_categories_category_id
  ON job_request_categories(category_id);
