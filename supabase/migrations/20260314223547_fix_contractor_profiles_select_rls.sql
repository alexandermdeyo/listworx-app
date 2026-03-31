/*
  # Fix contractor_profiles SELECT RLS policy

  ## Problem
  The existing SELECT policy `authenticated_select_contractor_profiles` is RESTRICTIVE.
  In PostgreSQL RLS, a RESTRICTIVE policy must be satisfied IN ADDITION TO any permissive
  policy. Since there is no permissive SELECT policy for authenticated users reading their
  own row, a newly signed-up contractor gets zero rows back — even though they own the row.
  This causes the dashboard polling loop to never find the profile.

  ## Fix
  1. Drop the RESTRICTIVE authenticated SELECT policy.
  2. Replace it with a PERMISSIVE SELECT policy that allows:
     - Contractors to read their own row (auth.uid() = user_id)
     - Admins to read all rows

  ## Security
  - The public permissive SELECT policy (approved/active contractors) is left untouched.
  - Authenticated contractors can only read their own profile.
  - Admins can read all profiles.
*/

DROP POLICY IF EXISTS "authenticated_select_contractor_profiles" ON contractor_profiles;

CREATE POLICY "contractor_can_read_own_profile"
  ON contractor_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "admin_can_read_all_profiles"
  ON contractor_profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = (SELECT auth.uid())) = 'ADMIN'
  );
