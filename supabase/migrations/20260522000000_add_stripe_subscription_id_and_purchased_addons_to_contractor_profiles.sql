/*
  # Add stripe_subscription_id and purchased_addons to contractor_profiles

  ## Problem
  The Stripe webhook handler (app/api/stripe-webhook/route.ts) writes two fields
  to contractor_profiles that do not exist as columns on that table, causing
  silent failures on every founder activation:

    1. stripe_subscription_id (line ~246) — the Stripe subscription ID created
       during founder activation. Stored here as a fast lookup on the profile
       in addition to the canonical subscriptions table.

    2. purchased_addons (line ~272) — array of add-on IDs bundled with the
       founder activation checkout (e.g. ironclad_badge_kit, decal_package_founder).

  ## Changes
  - Add stripe_subscription_id text to contractor_profiles
  - Add purchased_addons text[] to contractor_profiles
  - Add an index on stripe_subscription_id for webhook lookups
*/

ALTER TABLE contractor_profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS purchased_addons text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contractor_profiles_stripe_subscription_id
  ON contractor_profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
