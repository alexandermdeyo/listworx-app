-- Create Active Contractors View (Corrected)
-- This view identifies contractors who are approved and have active subscriptions
-- Used for filtering markets/categories in realtor request forms

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS active_contractors_view CASCADE;

-- Create materialized view for active contractors
CREATE MATERIALIZED VIEW active_contractors_view AS
SELECT DISTINCT
  cp.id as contractor_id,
  cp.user_id,
  cp.company_name,
  cp.owner_name,
  u.email,
  u.phone,
  cp.website,
  cp.years_in_business,
  cp.bio,
  COALESCE(s.status, 'INCOMPLETE') as subscription_status,
  cp.partner_status,
  cp.ironclad_accepted
FROM contractor_profiles cp
INNER JOIN users u ON cp.user_id = u.id
LEFT JOIN subscriptions s ON cp.id = s.contractor_id
WHERE
  cp.partner_status = 'ACTIVE'
  AND cp.ironclad_accepted = true
  AND (s.status = 'ACTIVE' OR s.status IS NULL);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_active_contractors_view_contractor_id
  ON active_contractors_view(contractor_id);

-- Grant SELECT access
GRANT SELECT ON active_contractors_view TO anon, authenticated;