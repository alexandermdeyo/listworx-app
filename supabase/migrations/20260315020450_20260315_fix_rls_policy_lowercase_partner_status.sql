/*
  # Fix RLS policy to use lowercase partner_status values

  ## Summary
  The public SELECT policy on contractor_profiles was checking for 'ACTIVE' and 'APPROVED'
  (uppercase). Since partner_status values have been migrated to lowercase, this policy
  must be updated to match 'active' and 'approved' instead.

  ## Changes
  1. Drop the old public_select_approved_contractors policy
  2. Recreate it with lowercase values
*/

DROP POLICY IF EXISTS "public_select_approved_contractors" ON contractor_profiles;

CREATE POLICY "public_select_approved_contractors"
  ON contractor_profiles
  FOR SELECT
  TO anon, authenticated
  USING (partner_status = ANY (ARRAY['active'::text, 'approved'::text]));
