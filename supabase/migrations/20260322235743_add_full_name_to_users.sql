/*
  # Add full_name to users table

  ## Summary
  Adds a `full_name` column to the public `users` table to support the simplified
  account creation flow where requestors provide their full name at signup.

  ## Changes
  - `users` table: add `full_name` (text, nullable, defaults to empty string)

  ## Notes
  - Column is nullable to preserve backwards compatibility with existing records
  - The signup page will always provide this value going forward
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text DEFAULT '';
  END IF;
END $$;
