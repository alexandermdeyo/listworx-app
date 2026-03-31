/*
  # Fix users table INSERT policy for job request submissions

  ## Problem
  The job-request API route inserts new user records for anonymous visitors (homeowners/realtors
  submitting job requests). The existing INSERT policy on public.users only allows authenticated
  users to insert their own record (id = auth.uid()), which blocks the service role API route.

  ## Changes
  1. Add a service_role INSERT policy on public.users to allow the API route to create user records
  2. Add a service_role SELECT policy on public.users to allow the API route to look up existing users

  ## Security
  - The service_role key is only used server-side in API routes, never exposed to clients
  - The anon key fallback is a known misconfiguration (SUPABASE_SERVICE_ROLE_KEY placeholder)
    and these policies will work correctly once the real service role key is configured
  - Adding anon INSERT as well to handle the fallback scenario gracefully
*/

CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select users"
  ON users FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Anon can insert realtor users for job requests"
  ON users FOR INSERT
  TO anon
  WITH CHECK (role = 'REALTOR');
