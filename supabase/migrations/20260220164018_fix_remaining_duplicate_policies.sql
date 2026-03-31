/*
  # Fix Remaining Duplicate Policies

  ## Overview
  Removes remaining duplicate UPDATE policy on users table to prevent multiple permissive policies issue.

  ## Changes
  - Drops the "Admins can update all users" policy which overlaps with "Users can update own data optimized"
  - The optimized policy already includes admin access, so the duplicate is unnecessary

  ## Security Notes
  - Maintains same access control - users can update own data, admins can update all
  - Improves performance by reducing policy evaluation overhead
*/

-- Remove duplicate UPDATE policy for users table
DROP POLICY IF EXISTS "Admins can update all users" ON users;
