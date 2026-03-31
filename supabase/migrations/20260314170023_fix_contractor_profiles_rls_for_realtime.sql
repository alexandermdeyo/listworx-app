/*
  # Fix contractor_profiles RLS for Realtime

  1. Changes
    - Add admin policies for managing contractor profiles
    - Ensure realtime updates can be broadcast to contractors
    - Add policy for contractors to insert their own profiles

  2. Security
    - Contractors can only view and update their own profile
    - Admins can view and update all profiles
    - Public can view approved/active contractors
*/

-- Drop existing policies to recreate with better structure
DROP POLICY IF EXISTS "Contractors can view own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Contractors can update own profile" ON contractor_profiles;
DROP POLICY IF EXISTS "Anyone can view approved contractors" ON contractor_profiles;

-- Contractors can view their own profile
CREATE POLICY "Contractors view own profile"
  ON contractor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Contractors can insert their own profile
CREATE POLICY "Contractors insert own profile"
  ON contractor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Contractors can update their own profile
CREATE POLICY "Contractors update own profile"
  ON contractor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can view approved/active contractors
CREATE POLICY "Public view approved contractors"
  ON contractor_profiles FOR SELECT
  TO anon, authenticated
  USING (partner_status IN ('APPROVED', 'ACTIVE'));

-- Admins can view all profiles
CREATE POLICY "Admins view all profiles"
  ON contractor_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins update all profiles"
  ON contractor_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );
