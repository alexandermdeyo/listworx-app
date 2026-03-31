/*
  # Fix Subscription Schema and Logic

  1. Schema Changes
    - Add stripe_customer_id to contractor_profiles for reference
    - Ensure subscriptions table is the billing source of truth
    - Add indexes for performance

  2. System of Record
    - subscriptions.status = billing truth (ACTIVE/PAST_DUE/CANCELLED/INCOMPLETE/TRIALING)
    - contractor_profiles.partner_status = application status truth (APPLIED/UNDER_REVIEW/APPROVED/ACTIVE/SUSPENDED/REJECTED/CANCELLED)

  3. Business Rules
    - A contractor can be ACTIVE only if:
      - partner_status = ACTIVE
      - subscriptions.status = ACTIVE
    - Successful subscription activation changes partner_status from APPROVED to ACTIVE

  4. Data Migration
    - Add stripe_customer_id to contractor_profiles for easier lookups
*/

-- Add stripe_customer_id to contractor_profiles (for easier reference and webhooks)
ALTER TABLE contractor_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create index for faster lookups by stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_stripe_customer_id 
ON contractor_profiles(stripe_customer_id);

-- Create index on subscriptions for contractor lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_contractor_id 
ON subscriptions(contractor_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id 
ON subscriptions(stripe_subscription_id);

-- Add constraint to ensure unique stripe_customer_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_contractor_profiles_stripe_customer_unique 
ON contractor_profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Function to check if contractor can be ACTIVE
CREATE OR REPLACE FUNCTION can_contractor_be_active(contractor_profile_id uuid)
RETURNS boolean AS $$
DECLARE
  profile_status partner_status;
  subscription_active boolean;
BEGIN
  -- Get contractor partner_status
  SELECT partner_status INTO profile_status
  FROM contractor_profiles
  WHERE id = contractor_profile_id;

  -- Check if there's an active subscription
  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE contractor_id = contractor_profile_id
    AND status = 'ACTIVE'
  ) INTO subscription_active;

  -- Contractor is truly active only if both conditions are met
  RETURN profile_status = 'ACTIVE' AND subscription_active;
END;
$$ LANGUAGE plpgsql;

-- View to get contractors who are truly active (both profile and subscription)
CREATE OR REPLACE VIEW active_contractors AS
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

-- Comment explaining the data model
COMMENT ON TABLE subscriptions IS 'Billing source of truth. Status reflects Stripe subscription state: ACTIVE, PAST_DUE, CANCELLED, INCOMPLETE, TRIALING';
COMMENT ON COLUMN contractor_profiles.partner_status IS 'Application/profile status: APPLIED, UNDER_REVIEW, APPROVED (ready for payment), ACTIVE (approved + paid), SUSPENDED, REJECTED, CANCELLED';
COMMENT ON FUNCTION can_contractor_be_active IS 'Returns true only if contractor has partner_status=ACTIVE AND an active subscription';
COMMENT ON VIEW active_contractors IS 'Contractors who have both partner_status=ACTIVE and subscription status=ACTIVE';
