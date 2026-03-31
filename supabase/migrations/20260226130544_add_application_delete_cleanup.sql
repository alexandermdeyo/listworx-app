/*
  # Add Application Delete Cleanup

  1. Changes
    - Drop existing foreign key constraints on junction tables
    - Add CASCADE DELETE to junction tables so deleting an application cleans up related data
    - This ensures when a contractor application is deleted, all related counties and categories are also removed

  2. Security
    - No changes to RLS policies
    - Maintains data integrity through proper cascading deletes
*/

-- Drop existing foreign key constraints
ALTER TABLE contractor_application_counties
DROP CONSTRAINT IF EXISTS contractor_application_counties_application_id_fkey;

ALTER TABLE contractor_application_categories
DROP CONSTRAINT IF EXISTS contractor_application_categories_application_id_fkey;

-- Re-add foreign keys with CASCADE DELETE
ALTER TABLE contractor_application_counties
ADD CONSTRAINT contractor_application_counties_application_id_fkey
FOREIGN KEY (application_id)
REFERENCES contractor_applications(id)
ON DELETE CASCADE;

ALTER TABLE contractor_application_categories
ADD CONSTRAINT contractor_application_categories_application_id_fkey
FOREIGN KEY (application_id)
REFERENCES contractor_applications(id)
ON DELETE CASCADE;