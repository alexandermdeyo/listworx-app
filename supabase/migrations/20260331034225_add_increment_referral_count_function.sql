/*
  # Add increment_referral_count RPC function

  1. New Functions
    - `increment_referral_count(contractor_id_input uuid)` - atomically increments total_referrals_received

  2. Notes
    - Used by matching system to track how many referrals each contractor has received
    - Enables fair rotation within same-tier contractors
*/

CREATE OR REPLACE FUNCTION increment_referral_count(contractor_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contractor_profiles
  SET total_referrals_received = COALESCE(total_referrals_received, 0) + 1
  WHERE id = contractor_id_input;
END;
$$;