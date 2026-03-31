/*
  # Fix contractor_profiles RLS for INSERT and UPDATE

  ## Problem
  The UPDATE policy is RESTRICTIVE, meaning it blocks updates unless conditions are met
  even when other PERMISSIVE policies would allow it. We need PERMISSIVE policies for
  contractors to update their own rows and insert their own profile.

  ## Changes
  1. Drop the RESTRICTIVE UPDATE policy
  2. Add PERMISSIVE UPDATE policy for contractors (own row) and admins
  3. Ensure INSERT policy exists and is correct
  4. Add a permissive INSERT policy if not already correct

  ## Security
  - Contractors can only INSERT/UPDATE their own row (auth.uid() = user_id)
  - Admins can UPDATE any row
  - RLS stays enabled
*/

-- Drop restrictive update policy that was blocking updates
DROP POLICY IF EXISTS "authenticated_update_contractor_profiles" ON contractor_profiles;

-- Drop and recreate insert policy cleanly
DROP POLICY IF EXISTS "contractors_insert_own_profile" ON contractor_profiles;

-- Permissive INSERT: contractor can insert their own profile
CREATE POLICY "contractors_insert_own_profile"
  ON contractor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Permissive UPDATE: contractor can update their own profile
CREATE POLICY "contractors_update_own_profile"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Permissive UPDATE: admin can update any profile
CREATE POLICY "admin_update_any_profile"
  ON contractor_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'ADMIN'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'ADMIN'
  );
