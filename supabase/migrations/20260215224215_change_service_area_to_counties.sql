/*
  # Change Service Area from Zip Codes to Counties

  ## Overview
  Updates contractor_profiles to use counties instead of zip codes for service areas

  ## Changes
  1. Rename service_area_zips column to service_area_counties
  2. Column remains as text array type for storing multiple county names
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'service_area_zips'
  ) THEN
    ALTER TABLE contractor_profiles RENAME COLUMN service_area_zips TO service_area_counties;
  END IF;
END $$;
