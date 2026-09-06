/*
  # Add partner_type to promo_partners

  Classifies each homepage promo partner as a supplier, a brokerage, or other
  (flyer drop-off spot, referral partner, etc). Admin-managed via
  /admin/crm/partners. Purely organisational — the public logo strip still
  renders every visible partner together.

  ## Change
  - `partner_type` (text, NOT NULL, default 'other')
  - CHECK constraint limits it to 'supplier' | 'brokerage' | 'other'

  Existing rows backfill to 'other' via the default.
*/

ALTER TABLE promo_partners
  ADD COLUMN IF NOT EXISTS partner_type text NOT NULL DEFAULT 'other';

ALTER TABLE promo_partners
  DROP CONSTRAINT IF EXISTS promo_partners_partner_type_check;

ALTER TABLE promo_partners
  ADD CONSTRAINT promo_partners_partner_type_check
  CHECK (partner_type IN ('supplier', 'brokerage', 'other'));
