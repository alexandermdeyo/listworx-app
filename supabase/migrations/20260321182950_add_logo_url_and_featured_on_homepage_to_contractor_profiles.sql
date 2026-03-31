/*
  # Add Logo URL and Featured On Homepage to Contractor Profiles

  ## Summary
  Extends contractor_profiles with two new columns to support the controlled
  contractor logo display system on the ListWorx homepage.

  ## New Columns

  ### contractor_profiles
  - `logo_url` (text, nullable) — Public URL of the contractor's uploaded logo,
    stored in the Supabase `logos` storage bucket. Null if no logo has been uploaded.
  - `featured_on_homepage` (boolean, DEFAULT false) — Admin-controlled flag.
    When true, this contractor's logo is eligible to appear in the homepage
    trust strip (subject to partner_status = 'active' and logo_url existing).

  ## Security Notes
  - No new RLS policies needed — these columns inherit existing contractor_profiles policies.
  - Only admins (via service role) update featured_on_homepage.
  - logo_url is publicly readable (logos bucket is already public).

  ## Important Notes
  1. featured_on_homepage defaults to false — no contractor is featured automatically.
  2. Admin must explicitly set featured_on_homepage = true per contractor.
  3. Homepage query filters on partner_status = 'active' AND featured_on_homepage = true AND logo_url IS NOT NULL.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN logo_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contractor_profiles' AND column_name = 'featured_on_homepage'
  ) THEN
    ALTER TABLE contractor_profiles ADD COLUMN featured_on_homepage boolean DEFAULT false;
  END IF;
END $$;
