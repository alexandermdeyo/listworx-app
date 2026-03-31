/*
  # Add public read policies for categories and markets

  1. Changes
    - Add RLS policy to allow anyone to read categories (public data)
    - Add RLS policy to allow anyone to read markets (public data)
  
  2. Security
    - Categories and markets are public reference data
    - Read-only access for unauthenticated users
    - No write access without proper authentication
*/

DROP POLICY IF EXISTS "Anyone can read active categories" ON categories;
CREATE POLICY "Anyone can read active categories"
  ON categories
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can read active markets" ON markets;
CREATE POLICY "Anyone can read active markets"
  ON markets
  FOR SELECT
  USING (is_active = true);