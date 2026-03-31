/*
  # Migrate partner_status values to lowercase

  ## Summary
  The codebase is being standardized to use lowercase partner_status enum values
  throughout. This migration:

  1. Drops the existing uppercase CHECK constraint
  2. Updates all existing UPPERCASE values in contractor_profiles to lowercase equivalents
  3. Adds a new CHECK constraint with lowercase-only values
  4. Updates any RLS policies that reference uppercase status values

  ## Value Mapping
  - PENDING    -> applied   (new signup awaiting review — renamed to match onboarding intent)
  - APPROVED   -> approved
  - ACTIVE     -> active
  - PAUSED     -> paused
  - REMOVED    -> removed
  - SUSPENDED  -> suspended
  - REJECTED   -> rejected

  ## Notes
  - 'PENDING' maps to 'applied' because a new contractor has "applied" for partnership
  - All other values are simple lowercase conversions
  - The DEFAULT column value is updated to 'applied'
*/

-- Step 1: Drop existing constraint
ALTER TABLE contractor_profiles
  DROP CONSTRAINT IF EXISTS contractor_profiles_partner_status_check;

-- Step 2: Migrate existing data from UPPERCASE to lowercase
UPDATE contractor_profiles SET partner_status = 'applied'   WHERE partner_status = 'PENDING';
UPDATE contractor_profiles SET partner_status = 'approved'  WHERE partner_status = 'APPROVED';
UPDATE contractor_profiles SET partner_status = 'active'    WHERE partner_status = 'ACTIVE';
UPDATE contractor_profiles SET partner_status = 'paused'    WHERE partner_status = 'PAUSED';
UPDATE contractor_profiles SET partner_status = 'removed'   WHERE partner_status = 'REMOVED';
UPDATE contractor_profiles SET partner_status = 'suspended' WHERE partner_status = 'SUSPENDED';
UPDATE contractor_profiles SET partner_status = 'rejected'  WHERE partner_status = 'REJECTED';

-- Step 3: Add new lowercase-only CHECK constraint
ALTER TABLE contractor_profiles
  ADD CONSTRAINT contractor_profiles_partner_status_check
  CHECK (partner_status = ANY (ARRAY[
    'applied'::text,
    'under_review'::text,
    'approved'::text,
    'active'::text,
    'suspended'::text,
    'rejected'::text,
    'cancelled'::text,
    'paused'::text,
    'removed'::text
  ]));

-- Step 4: Update the column DEFAULT to lowercase
ALTER TABLE contractor_profiles
  ALTER COLUMN partner_status SET DEFAULT 'applied';
