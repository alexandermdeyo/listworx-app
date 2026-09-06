/*
  # Media partner booking system

  ## contractor_profiles
  - is_media_partner (bool)   — admin flag; a contractor who is a paid Media Partner
  - media_quarterly_rate      — negotiated bulk rate ListWorx pays this partner
                                per Elite quarterly content session

  ## media_bookings
  Requester (contractor or realtor) books a media partner (a contractor whose
  is_media_partner = true). Three sources:
    - dashboard              — contractor-sourced; ListWorx takes commission_rate
                               (default 12.5%) of job_value, billed to the partner.
    - realtor_referral_pool  — realtor-sourced; no fee (covered by membership).
    - elite_quarterly        — Elite contractor's one free quarterly session;
                               no commission, ListWorx pays partner_payout directly.

  commission_owed is a generated column: job_value * commission_rate, rounded,
  only for source='dashboard'. Elite quarterly entitlement is enforced by a
  partial unique index on (requester_contractor_id, quarter).

  Applied to the database out of band; this file records it.
*/

ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS is_media_partner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_quarterly_rate numeric(10,2);

CREATE TABLE IF NOT EXISTS media_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_partner_id uuid NOT NULL REFERENCES contractor_profiles(id) ON DELETE RESTRICT,
  requester_type          text NOT NULL CHECK (requester_type IN ('contractor','realtor')),
  requester_user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_contractor_id uuid REFERENCES contractor_profiles(id) ON DELETE SET NULL,
  requester_realtor_id    uuid REFERENCES requestor_profiles(id) ON DELETE SET NULL,
  source  text NOT NULL CHECK (source IN ('dashboard','realtor_referral_pool','elite_quarterly')),
  status  text NOT NULL DEFAULT 'requested'
          CHECK (status IN ('requested','confirmed','declined','completed','cancelled')),
  property_address text,
  preferred_date   date,
  notes            text NOT NULL DEFAULT '',
  decline_reason   text,
  job_value       numeric(10,2),
  commission_rate numeric(4,3) NOT NULL DEFAULT 0.125 CHECK (commission_rate BETWEEN 0 AND 1),
  commission_owed numeric(10,2) GENERATED ALWAYS AS (
    CASE WHEN source = 'dashboard' AND job_value IS NOT NULL
         THEN round(job_value * commission_rate, 2) END
  ) STORED,
  partner_payout  numeric(10,2),
  quarter text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_bookings_no_commission_off_dashboard CHECK (source = 'dashboard' OR job_value IS NULL),
  CONSTRAINT media_bookings_payout_only_quarterly       CHECK (source = 'elite_quarterly' OR partner_payout IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS media_bookings_elite_quarter_uniq
  ON media_bookings (requester_contractor_id, quarter) WHERE source = 'elite_quarterly';
CREATE INDEX IF NOT EXISTS media_bookings_partner_idx ON media_bookings (media_partner_id, status, requested_at DESC);
CREATE INDEX IF NOT EXISTS media_bookings_requester_idx ON media_bookings (requester_user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS media_bookings_report_idx ON media_bookings (completed_at) WHERE source = 'dashboard' AND status = 'completed';

ALTER TABLE media_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_bookings_read ON media_bookings;
CREATE POLICY media_bookings_read ON media_bookings FOR SELECT TO authenticated
  USING (public.is_admin()
    OR requester_user_id = auth.uid()
    OR media_partner_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS media_bookings_insert ON media_bookings;
CREATE POLICY media_bookings_insert ON media_bookings FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid() AND status = 'requested');

DROP POLICY IF EXISTS media_bookings_update ON media_bookings;
CREATE POLICY media_bookings_update ON media_bookings FOR UPDATE TO authenticated
  USING (public.is_admin()
    OR media_partner_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid())
    OR requester_user_id = auth.uid())
  WITH CHECK (public.is_admin()
    OR media_partner_id IN (SELECT id FROM contractor_profiles WHERE user_id = auth.uid())
    OR requester_user_id = auth.uid());
