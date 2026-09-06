/*
  # Create partner_inquiries

  Stores contact-form submissions from the two partner marketing pages
  (/become-a-supplier-partner and /become-a-brokerage-partner). Reviewed in
  the admin CRM at /admin/crm/partner-inquiries.

  ## Table
  - `kind` — 'supplier' | 'brokerage'
  - `org_name` — company name / brokerage name
  - `contact_name`, `email`, `phone`
  - `details` — free text ("tell us about your business" / "which market do you serve")
  - `status` — 'new' | 'contacted' | 'archived' (default 'new')
  - `created_at`

  ## Security
  - RLS enabled. Public (anon + authenticated) can INSERT — these are open
    marketing forms. Reads/updates/deletes go through the service role
    (/api/partner-inquiry) after a Bearer-token admin check, so no SELECT /
    UPDATE / DELETE policy is defined.
*/

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('supplier', 'brokerage')),
  org_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can submit a partner inquiry" ON partner_inquiries;
CREATE POLICY "anyone can submit a partner inquiry"
  ON partner_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS partner_inquiries_created_idx
  ON partner_inquiries (created_at DESC);
