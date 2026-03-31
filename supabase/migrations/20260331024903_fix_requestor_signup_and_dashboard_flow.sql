/*
  # Fix requestor signup, job request ownership, and RLS policies

  ## Problem
  1. Requestor signup tried to use roles like REALTOR/HOMEOWNER/PROPERTY_MANAGER
     but users.role check constraint only allows USER, CONTRACTOR, ADMIN.
  2. Code referenced non-existent requestor_profiles table (actual table is realtor_profiles).
  3. Code referenced non-existent requestor_id column on job_requests (actual column is realtor_id).
  4. An RLS policy on users allowed anon insert only for role='REALTOR' which conflicts with the constraint.
  5. Requestor dashboard queried job_requests.requestor_id which does not exist.

  ## Changes
  1. Drop the stale anon insert policy on users that checks for role='REALTOR'
  2. Add a display_name column to realtor_profiles if not present (already exists per schema)
  3. No schema changes to users or job_requests -- code will be fixed to use actual columns

  ## Security
  - Remove the broken anon insert policy for users (signup uses service_role)
  - No new permissive policies added
*/

-- Drop the broken anon insert policy that checks for REALTOR role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Anon can insert realtor users for job requests'
  ) THEN
    DROP POLICY "Anon can insert realtor users for job requests" ON public.users;
  END IF;
END $$;

-- Ensure realtor_profiles has an insert policy for authenticated users
-- (so after signup, the service_role insert works, but also so users could insert via client if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'realtor_profiles'
      AND policyname = 'Authenticated users can insert own realtor profile'
  ) THEN
    CREATE POLICY "Authenticated users can insert own realtor profile"
      ON public.realtor_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure realtor_profiles has an update policy for own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'realtor_profiles'
      AND policyname = 'Users can update own realtor profile'
  ) THEN
    CREATE POLICY "Users can update own realtor profile"
      ON public.realtor_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Ensure job_requests has a select policy for requestors via realtor_profiles
-- The existing policy "Realtors can read own job requests" already handles this via:
-- EXISTS (SELECT 1 FROM realtor_profiles rp WHERE rp.id = job_requests.realtor_id AND rp.user_id = auth.uid())
-- This is correct. No change needed.
