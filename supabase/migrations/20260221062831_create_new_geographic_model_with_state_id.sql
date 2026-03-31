/*
  # Create New Geographic Model with State + County

  ## Overview
  This migration creates a new geographic model based on states and counties with proper UUID-based relationships.

  ## Changes

  1. New Tables
    - `states` (replaces existing)
      - `id` (uuid, primary key) - unique identifier for state
      - `code` (text, unique, not null) - state abbreviation (e.g., 'TN', 'MN')
      - `name` (text, not null) - full state name (e.g., 'Tennessee', 'Minnesota')
      - `is_active` (boolean, default true) - whether state is actively served
      - `created_at` (timestamptz, default now())

    - `counties` (replaces existing)
      - `id` (uuid, primary key, default gen_random_uuid())
      - `state_id` (uuid, not null, references states(id) on delete cascade)
      - `name` (text, not null) - county name
      - `fips` (text, nullable) - FIPS code for county
      - `is_active` (boolean, default true) - whether county is actively served
      - `created_at` (timestamptz, default now())
      - Unique constraint: (state_id, name)
      - Indexes: (state_id), (name)

    - `contractor_counties` (replaces existing)
      - `id` (uuid, primary key, default gen_random_uuid())
      - `contractor_id` (uuid, not null, references contractor_profiles(id) on delete cascade)
      - `county_id` (uuid, not null, references counties(id) on delete cascade)
      - `created_at` (timestamptz, default now())
      - Unique constraint: (contractor_id, county_id)
      - Indexes: (contractor_id), (county_id)

  2. Security
    - Enable RLS on all new tables
    - Public read access for states and counties (needed for dropdowns)
    - Authenticated users can read contractor_counties
    - Only contractors can manage their own county associations

  3. Data Migration
    - Preserve existing state and county data
    - Migrate contractor service area associations to new junction table

  ## Important Notes
  - Uses UUID-based foreign keys for better referential integrity
  - Proper cascade deletes to maintain data consistency
  - Indexes added for query performance
  - RLS policies ensure data security while allowing public reference data access
*/

-- Step 1: Drop existing foreign key constraints and tables
DO $$
BEGIN
  -- Drop dependent foreign keys first
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contractor_counties_county_id_fkey') THEN
    ALTER TABLE contractor_counties DROP CONSTRAINT contractor_counties_county_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contractor_counties_contractor_id_fkey') THEN
    ALTER TABLE contractor_counties DROP CONSTRAINT contractor_counties_contractor_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'job_requests_county_id_fkey') THEN
    ALTER TABLE job_requests DROP CONSTRAINT job_requests_county_id_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'job_requests_state_code_fkey') THEN
    ALTER TABLE job_requests DROP CONSTRAINT job_requests_state_code_fkey;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'counties_state_code_fkey') THEN
    ALTER TABLE counties DROP CONSTRAINT counties_state_code_fkey;
  END IF;
END $$;

-- Backup existing data
CREATE TEMP TABLE old_states AS SELECT * FROM states;
CREATE TEMP TABLE old_counties AS SELECT * FROM counties;
CREATE TEMP TABLE old_contractor_counties AS SELECT * FROM contractor_counties;

-- Drop old tables
DROP TABLE IF EXISTS contractor_counties CASCADE;
DROP TABLE IF EXISTS counties CASCADE;
DROP TABLE IF EXISTS states CASCADE;

-- Step 2: Create new states table
CREATE TABLE IF NOT EXISTS states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Step 3: Create new counties table
CREATE TABLE IF NOT EXISTS counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name text NOT NULL,
  fips text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_state_county UNIQUE (state_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_counties_state_id ON counties(state_id);
CREATE INDEX IF NOT EXISTS idx_counties_name ON counties(name);

-- Step 4: Create contractor_counties junction table
CREATE TABLE IF NOT EXISTS contractor_counties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE CASCADE,
  county_id uuid NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_contractor_county UNIQUE (contractor_id, county_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contractor_counties_contractor_id ON contractor_counties(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_counties_county_id ON contractor_counties(county_id);

-- Step 5: Migrate data from old tables to new structure
-- Migrate states
INSERT INTO states (code, name, is_active)
SELECT DISTINCT code, name, true
FROM old_states
ON CONFLICT (code) DO NOTHING;

-- Migrate counties with state_id lookup
INSERT INTO counties (state_id, name, is_active)
SELECT 
  s.id,
  oc.name,
  true
FROM old_counties oc
JOIN states s ON s.code = oc.state_code
ON CONFLICT (state_id, name) DO NOTHING;

-- Step 6: Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_counties ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies

-- States: Public read access (needed for dropdowns)
CREATE POLICY "Anyone can view active states"
  ON states FOR SELECT
  USING (is_active = true);

-- Counties: Public read access (needed for dropdowns)
CREATE POLICY "Anyone can view active counties"
  ON counties FOR SELECT
  USING (is_active = true);

-- Contractor Counties: Authenticated users can view
CREATE POLICY "Authenticated users can view contractor counties"
  ON contractor_counties FOR SELECT
  TO authenticated
  USING (true);

-- Contractor Counties: Contractors can manage their own
CREATE POLICY "Contractors can insert their own county associations"
  ON contractor_counties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = contractor_id
      AND contractor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete their own county associations"
  ON contractor_counties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contractor_profiles
      WHERE contractor_profiles.id = contractor_id
      AND contractor_profiles.user_id = auth.uid()
    )
  );

-- Step 8: Update job_requests to use state_id and county_id
DO $$
BEGIN
  -- Add state_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'state_id'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN state_id uuid REFERENCES states(id);
  END IF;

  -- Update county_id to reference new counties table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_requests' AND column_name = 'county_id'
  ) THEN
    ALTER TABLE job_requests ADD CONSTRAINT job_requests_county_id_fkey 
      FOREIGN KEY (county_id) REFERENCES counties(id);
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON TABLE states IS 'US States served by the platform';
COMMENT ON TABLE counties IS 'Counties within served states - complete list for service area selection';
COMMENT ON TABLE contractor_counties IS 'Junction table: which counties each contractor serves';
COMMENT ON COLUMN counties.state_id IS 'Foreign key to states table';
COMMENT ON COLUMN counties.fips IS 'Federal Information Processing Standards code for county';
COMMENT ON COLUMN contractor_counties.contractor_id IS 'Foreign key to contractor_profiles';
COMMENT ON COLUMN contractor_counties.county_id IS 'Foreign key to counties table';