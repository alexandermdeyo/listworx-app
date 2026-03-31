/*
  # Standardize partner_status Enum to Match HubSpot - Step 1: Add New Values

  1. Overview
    - Add PAUSED and REMOVED to partner_status enum
    - These must be added in a separate transaction before they can be used

  2. Changes
    - Add PAUSED status to partner_status enum
    - Add REMOVED status to partner_status enum
*/

-- Add PAUSED if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PAUSED'
    AND enumtypid = 'partner_status'::regtype
  ) THEN
    ALTER TYPE partner_status ADD VALUE 'PAUSED';
  END IF;
END $$;

-- Add REMOVED if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'REMOVED'
    AND enumtypid = 'partner_status'::regtype
  ) THEN
    ALTER TYPE partner_status ADD VALUE 'REMOVED';
  END IF;
END $$;
