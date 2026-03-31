/*
  # Migrate Markets Data to Counties Table

  ## Overview
  This migration moves existing county data from the markets table into the new counties table,
  preserving is_active status and avoiding duplicates.

  ## Changes

  1. Data Migration
    - Inserts all market records into counties table
    - Joins markets.state to states.code to get state_id
    - Preserves is_active status from markets
    - Uses ON CONFLICT to handle duplicates (skip if exists)
    - Does NOT delete or modify the markets table

  2. Important Notes
    - Markets table contains 182 county records across 2 states (TN, MN)
    - The unique constraint (state_id, name) prevents duplicates
    - is_active status is preserved from the original markets data
    - Markets table remains unchanged for backward compatibility during transition
*/

-- Step 1: Ensure states exist for TN and MN
INSERT INTO states (code, name, is_active)
VALUES 
  ('TN', 'Tennessee', true),
  ('MN', 'Minnesota', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

-- Step 2: Migrate county data from markets to counties
INSERT INTO counties (state_id, name, is_active, created_at)
SELECT 
  s.id as state_id,
  m.name,
  COALESCE(m.is_active, true) as is_active,
  m.created_at
FROM markets m
JOIN states s ON s.code = m.state
ON CONFLICT (state_id, name) DO NOTHING;

-- Add comment documenting the migration
COMMENT ON TABLE counties IS 'Counties within served states - migrated from markets table and ready for service area selection';