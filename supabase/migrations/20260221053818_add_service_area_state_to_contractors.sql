/*
  # Add service area state to contractor profiles

  1. Changes
    - Add `service_area_state` column to track which state(s) contractors serve
    - Contractors can serve one state at a time (for now, only Tennessee)
    - This supports the new state/county selection UI in the application form
  
  2. Notes
    - Default to 'TN' for Tennessee
    - This replaces the market-based selection with state/county approach
*/

-- Add service_area_state column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'service_area_state'
  ) THEN
    ALTER TABLE contractor_profiles 
    ADD COLUMN service_area_state text DEFAULT 'TN';
  END IF;
END $$;

-- Add index for filtering by state
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_service_area_state 
ON contractor_profiles(service_area_state) 
WHERE service_area_state IS NOT NULL;