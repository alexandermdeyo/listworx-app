/*
  # Create promo_partners table

  ## Summary
  Backs the "Trusted by local businesses across Tennessee" logo splash on the
  marketing homepage. These are businesses that help promote ListWorx — flyer
  drop-off spots, referral partners — NOT vetted contractors (those already
  live on contractor_profiles.featured_on_homepage).

  Fully admin-managed from /admin/crm/partners: upload a logo, set a name and
  optional link, toggle visible/hidden, mark as featured, and set display order.
  No code changes needed to add or remove one.

  ## New table
  - `promo_partners`
    - `id` (uuid, pk)
    - `name` (text, required) — business name, used as logo alt text
    - `logo_url` (text, required) — public URL in the `logos` storage bucket
    - `link_url` (text, nullable) — optional outbound link wrapped around the logo
    - `is_visible` (boolean, default false) — live on the site when true
    - `is_featured` (boolean, default false) — sorts first / rendered slightly larger
    - `display_order` (integer, default 0) — manual ordering within a group
    - `created_at` / `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public (anon + authenticated) SELECT only where is_visible = true
  - INSERT / UPDATE / DELETE restricted to admins (app_metadata role = 'admin')
  - Admin API routes use the service role and additionally verify the caller's
    role, so the public policy is the only one clients hit directly.

  ## Storage
  - Reuses the existing public `logos` bucket; partner logos are stored under a
    `promo-partners/` path prefix. No new bucket required.
*/

CREATE TABLE IF NOT EXISTS promo_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  link_url text,
  is_visible boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read visible promo partners" ON promo_partners;
CREATE POLICY "Public can read visible promo partners"
  ON promo_partners
  FOR SELECT
  TO anon, authenticated
  USING (is_visible = true);

DROP POLICY IF EXISTS "Admins can insert promo partners" ON promo_partners;
CREATE POLICY "Admins can insert promo partners"
  ON promo_partners
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update promo partners" ON promo_partners;
CREATE POLICY "Admins can update promo partners"
  ON promo_partners
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete promo partners" ON promo_partners;
CREATE POLICY "Admins can delete promo partners"
  ON promo_partners
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE INDEX IF NOT EXISTS promo_partners_public_order_idx
  ON promo_partners (is_visible, is_featured DESC, display_order ASC, created_at ASC);
