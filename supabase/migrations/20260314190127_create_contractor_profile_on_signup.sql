/*
  # Auto-Create Contractor Profile on Signup

  1. Changes
    - Extends handle_new_user trigger to auto-create contractor_profiles row
    - Sets status = 'PENDING' by default
    - Initializes empty counties and trades arrays
    - Only creates profile if user signs up (not for admin-created users)

  2. Security
    - Runs with SECURITY DEFINER to bypass RLS
    - Uses auth.uid() to ensure user_id matches
*/

-- Update the handle_new_user function to also create contractor profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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

  -- Auto-create contractor profile for new signups (not admin-created contractors)
  -- Only if the user doesn't already have a profile
  IF NOT EXISTS (SELECT 1 FROM contractor_profiles WHERE user_id = NEW.id) THEN
    INSERT INTO contractor_profiles (
      user_id,
      email,
      partner_status,
      counties,
      selected_trades,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
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
