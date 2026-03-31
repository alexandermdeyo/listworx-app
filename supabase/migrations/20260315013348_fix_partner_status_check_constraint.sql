/*
  # Fix partner_status CHECK constraint to include PAUSED and REMOVED

  ## Problem
  The stripe webhook sets partner_status to 'PAUSED' (on payment failure/cancellation)
  and 'REMOVED' (on subscription deletion), but the CHECK constraint only allows:
  PENDING, APPROVED, ACTIVE, SUSPENDED, REJECTED

  ## Changes
  1. Drop the existing restrictive CHECK constraint
  2. Add a new CHECK constraint that includes PAUSED and REMOVED

  ## Valid values after this migration
  - PENDING: new signup, awaiting application review
  - APPROVED: application approved, awaiting payment
  - ACTIVE: approved + active subscription, receiving leads
  - PAUSED: subscription past due or canceled (replaces SUSPENDED)
  - REMOVED: subscription deleted, permanently removed
  - SUSPENDED: legacy (kept for backward compatibility)
  - REJECTED: application rejected
*/

ALTER TABLE contractor_profiles
  DROP CONSTRAINT IF EXISTS contractor_profiles_partner_status_check;

ALTER TABLE contractor_profiles
  ADD CONSTRAINT contractor_profiles_partner_status_check
  CHECK (partner_status = ANY (ARRAY[
    'PENDING'::text,
    'APPROVED'::text,
    'ACTIVE'::text,
    'PAUSED'::text,
    'REMOVED'::text,
    'SUSPENDED'::text,
    'REJECTED'::text
  ]));
