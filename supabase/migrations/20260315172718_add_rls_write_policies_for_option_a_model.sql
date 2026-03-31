/*
  # Add RLS write policies for Option A data model

  ## Summary
  The live contractor onboarding flow now writes directly to contractor_counties and
  contractor_categories instead of contractor_application_counties / contractor_application_categories.
  This migration adds the missing INSERT, UPDATE, and DELETE policies so authenticated contractors
  can manage their own rows in those tables.

  ## Changes

  ### contractor_counties
  - Add INSERT policy: contractor can insert rows where contractor_id matches their own profile id
  - Add DELETE policy: contractor can delete their own rows (needed for upsert-replace pattern)

  ### contractor_categories
  - Add INSERT policy: contractor can insert rows where contractor_id matches their own profile id
  - Add DELETE policy: contractor can delete their own rows (needed for upsert-replace pattern)

  ## Notes
  - Old contractor_application* tables are untouched — they remain as legacy/archive.
  - The "Anyone can view" SELECT policies already exist on both tables; we only add write policies here.
*/

-- contractor_counties: authenticated contractor can insert own rows
CREATE POLICY "Contractors can insert own counties"
  ON contractor_counties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- contractor_counties: authenticated contractor can delete own rows
CREATE POLICY "Contractors can delete own counties"
  ON contractor_counties
  FOR DELETE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- contractor_categories: authenticated contractor can insert own rows
CREATE POLICY "Contractors can insert own categories"
  ON contractor_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );

-- contractor_categories: authenticated contractor can delete own rows
CREATE POLICY "Contractors can delete own categories"
  ON contractor_categories
  FOR DELETE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractor_profiles WHERE user_id = auth.uid()
    )
  );
