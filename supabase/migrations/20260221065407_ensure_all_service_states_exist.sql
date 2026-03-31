/*
  # Ensure All Service States Exist

  1. Purpose
    - Guarantees that all 4 service states (TN, MN, WI, KY) exist in the states table
    - Safe to run multiple times (uses ON CONFLICT)
    - Admin-safe seed script for production deployment

  2. States Seeded
    - Tennessee (TN)
    - Minnesota (MN)
    - Wisconsin (WI)
    - Kentucky (KY)

  3. Notes
    - All states marked as active
    - Counties are handled in separate migration
    - Uses ON CONFLICT to prevent duplicates
*/

INSERT INTO states (code, name, is_active) VALUES
  ('TN', 'Tennessee', true),
  ('MN', 'Minnesota', true),
  ('WI', 'Wisconsin', true),
  ('KY', 'Kentucky', true)
ON CONFLICT (code) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  name = EXCLUDED.name;
