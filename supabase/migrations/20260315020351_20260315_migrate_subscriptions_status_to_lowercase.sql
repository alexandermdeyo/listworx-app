/*
  # Migrate subscriptions.status values to lowercase

  ## Summary
  The stripe webhook now writes lowercase status values to the subscriptions table.
  This migration updates the CHECK constraint and default value to match.

  ## Changes
  1. Drop existing uppercase CHECK constraint on subscriptions.status
  2. Migrate any existing data to lowercase (table is empty but done for safety)
  3. Add new lowercase CHECK constraint
  4. Update DEFAULT value to lowercase

  ## Valid values after migration
  - active
  - cancelled
  - past_due
  - paused
  - incomplete
  - trialing
*/

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

UPDATE subscriptions SET status = 'active'    WHERE status = 'ACTIVE';
UPDATE subscriptions SET status = 'cancelled' WHERE status = 'CANCELLED';
UPDATE subscriptions SET status = 'past_due'  WHERE status = 'PAST_DUE';
UPDATE subscriptions SET status = 'paused'    WHERE status = 'PAUSED';

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status = ANY (ARRAY[
    'active'::text,
    'cancelled'::text,
    'past_due'::text,
    'paused'::text,
    'incomplete'::text,
    'trialing'::text
  ]));

ALTER TABLE subscriptions
  ALTER COLUMN status SET DEFAULT 'active';
