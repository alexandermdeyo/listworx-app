/*
  # Fix handle_new_user trigger and contractor_profiles NOT NULL constraints

  ## Problem
  The handle_new_user() trigger fires on auth.users INSERT and tries to insert
  into contractor_profiles, but company_name, owner_name, and phone columns have
  NOT NULL constraints with no defaults. This causes "Database error saving new user"
  on every signup.

  ## Changes
  1. Make company_name, owner_name, phone nullable (or give them empty string defaults)
     so the trigger can insert a minimal placeholder row.
  2. Rewrite handle_new_user() to safely insert a minimal contractor_profiles row
     using empty strings for required text fields.
  3. Ensure RLS INSERT policy exists for authenticated users.

  ## Security
  - RLS remains enabled
  - INSERT policy already exists: (user_id = auth.uid())
*/

-- Step 1: Give NOT NULL columns safe defaults so trigger can insert minimal rows
ALTER TABLE contractor_profiles
  ALTER COLUMN company_name SET DEFAULT '',
  ALTER COLUMN owner_name SET DEFAULT '',
  ALTER COLUMN phone SET DEFAULT '';

-- Step 2: Replace handle_new_user with a safe version
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Auto-create a minimal contractor_profiles row (pending)
  -- Only if one doesn't already exist for this user
  IF NOT EXISTS (SELECT 1 FROM contractor_profiles WHERE user_id = NEW.id) THEN
    INSERT INTO contractor_profiles (
      user_id,
      email,
      company_name,
      owner_name,
      phone,
      partner_status,
      counties,
      selected_trades,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      '',
      '',
      '',
      'PENDING',
      '[]'::jsonb,
      '[]'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
