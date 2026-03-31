-- Fix RLS Policies for Public Read Access to Markets and Categories
-- This fixes the production issue where markets/categories were not loading in the UI

-- Drop existing SELECT policies that only allow authenticated users
DROP POLICY IF EXISTS "Markets read access" ON markets;
DROP POLICY IF EXISTS "Categories read access" ON categories;

-- Create new SELECT policies that allow both anon and authenticated users
CREATE POLICY "Markets read access for all"
  ON markets
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Categories read access for all"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);