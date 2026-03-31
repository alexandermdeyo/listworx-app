/*
  # Drop auth.users triggers — handle profile creation in application code

  ## Problem
  The on_auth_user_created and on_auth_user_updated triggers on auth.users call
  handle_new_user(), which tries to INSERT into public.users and contractor_profiles.
  This fails because:
  1. public.users has RLS enabled with no INSERT policy — even SECURITY DEFINER
     functions are blocked when RLS is active unless explicitly bypassed.
  2. The unique email constraint on public.users causes conflicts on retry.
  3. Any trigger failure rolls back the entire auth.users INSERT, producing
     "Database error saving new user" for the end user.

  ## Fix
  1. Drop both triggers from auth.users completely.
  2. Drop the handle_new_user function.
  3. Profile rows (contractor_profiles) are created by application code after
     successful auth signup, using the user's session for RLS compliance.
  4. public.users rows are also created by application code (or not needed at all
     since auth.users already tracks users).

  ## Notes
  - No data is lost. Existing rows in contractor_profiles and public.users remain.
  - New signups will have profiles created client-side immediately after auth.signUp succeeds.
*/

-- Drop triggers from auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS handle_new_user();

-- Ensure contractor_profiles INSERT policy exists for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contractor_profiles'
      AND policyname = 'contractors_insert_own_profile'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "contractors_insert_own_profile"
        ON contractor_profiles FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END $$;

-- Ensure public.users INSERT policy exists for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_insert_own_record'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "users_insert_own_record"
        ON users FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid())
    $policy$;
  END IF;
END $$;
