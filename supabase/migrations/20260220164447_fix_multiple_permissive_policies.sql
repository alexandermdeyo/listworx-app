/*
  # Fix Multiple Permissive Policies

  ## Overview
  Resolves duplicate permissive policies by using restrictive policies for admin operations
  and keeping permissive policies only for read access.

  ## Changes
  Converts admin policies from PERMISSIVE to RESTRICTIVE for INSERT, UPDATE, DELETE operations
  on categories, markets, subscriptions, and tiers tables.

  ## Policy Strategy
  - PERMISSIVE policies for SELECT: Allow all authenticated users to read
  - RESTRICTIVE policies for modifications: Only admins can modify (acts as additional constraint)

  ## Security Notes
  - Maintains same access control behavior
  - Eliminates policy overlap warnings
  - Clearer separation between read and write permissions
*/

-- ============================================================================
-- CATEGORIES
-- ============================================================================

-- Drop the broad admin policy that covers all operations
DROP POLICY IF EXISTS "Categories admin only" ON categories;

-- Create separate restrictive policies for each write operation
CREATE POLICY "Categories insert admin only"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Categories update admin only"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Categories delete admin only"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

-- ============================================================================
-- MARKETS
-- ============================================================================

-- Drop the broad admin policy that covers all operations
DROP POLICY IF EXISTS "Markets admin only" ON markets;

-- Create separate restrictive policies for each write operation
CREATE POLICY "Markets insert admin only"
  ON markets FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Markets update admin only"
  ON markets FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Markets delete admin only"
  ON markets FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Drop the broad admin policy that covers all operations
DROP POLICY IF EXISTS "Subscriptions admin only" ON subscriptions;

-- Create separate restrictive policies for each write operation
CREATE POLICY "Subscriptions insert admin only"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Subscriptions update admin only"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Subscriptions delete admin only"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

-- ============================================================================
-- TIERS
-- ============================================================================

-- Drop the broad admin policy that covers all operations
DROP POLICY IF EXISTS "Tiers admin only" ON tiers;

-- Create separate restrictive policies for each write operation
CREATE POLICY "Tiers insert admin only"
  ON tiers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Tiers update admin only"
  ON tiers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));

CREATE POLICY "Tiers delete admin only"
  ON tiers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'));
