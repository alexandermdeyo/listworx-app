/*
  # Standardize partner_status Enum to Match HubSpot - Step 2: Migrate Data

  1. Overview
    - Migrate existing SUSPENDED and CANCELLED values to new values
    - Update comments and views

  2. Changes
    - SUSPENDED -> PAUSED
    - CANCELLED -> REMOVED
    - Update comments
    - Recreate active_contractors view
    - Add performance index
*/

-- Migrate existing data: SUSPENDED -> PAUSED
UPDATE contractor_profiles
SET partner_status = 'PAUSED'
WHERE partner_status = 'SUSPENDED';

-- Migrate existing data: CANCELLED -> REMOVED
UPDATE contractor_profiles
SET partner_status = 'REMOVED'
WHERE partner_status = 'CANCELLED';

-- Update comments to reflect new status meanings
COMMENT ON COLUMN contractor_profiles.partner_status IS 'Application/profile status: APPLIED (initial submission), UNDER_REVIEW (being reviewed), APPROVED (approved, awaiting payment), ACTIVE (approved + paid, receiving referrals), PAUSED (temporarily inactive), REJECTED (denied), REMOVED (permanently removed)';

-- Update the active_contractors view to exclude PAUSED contractors
DROP VIEW IF EXISTS active_contractors;

CREATE VIEW active_contractors AS
SELECT
  cp.*,
  s.status as subscription_status,
  s.current_period_start,
  s.current_period_end,
  s.stripe_subscription_id
FROM contractor_profiles cp
INNER JOIN subscriptions s ON s.contractor_id = cp.id
WHERE cp.partner_status = 'ACTIVE'
  AND s.status = 'ACTIVE';

COMMENT ON VIEW active_contractors IS 'Contractors who have partner_status=ACTIVE and subscription status=ACTIVE (actively receiving referrals)';

-- Create index for performance on partner_status queries
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_partner_status
ON contractor_profiles(partner_status);

-- Update function comment
COMMENT ON FUNCTION can_contractor_be_active IS 'Returns true only if contractor has partner_status=ACTIVE AND an active subscription. Statuses: APPLIED, UNDER_REVIEW, APPROVED, ACTIVE, PAUSED, REJECTED, REMOVED';
