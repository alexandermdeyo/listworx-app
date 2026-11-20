-- ============================================================================
-- PROPOSED — NOT APPLIED. Adds the "Growth" ($199/mo) and "Business Pro"
-- ($299/mo) tiers rows -- the two approved paid tiers in ListWorx 2.0's new
-- membership structure. resolveTierId() in app/api/stripe-webhook/route.ts
-- looks these up by name (slugToNameMap: growth -> 'Growth', business_pro ->
-- 'Business Pro') once a real checkout completes, so a subscriptions row can
-- be created with the correct tier_id.
--
-- Additive only: no existing tiers row, subscriptions row, or
-- contractor_profiles row is touched. monthly_price/annual_price are stored
-- in cents, matching every existing tiers row's convention.
--
-- annual_price is set equal to 12x monthly here as a storage placeholder
-- ONLY -- no annual rate for Growth/Business Pro has been approved. Do not
-- treat this as a real annual price; update it (or decide these are
-- monthly-only) before any annual billing option is ever exposed.
--
-- This migration does NOT create the matching Stripe Price objects --
-- that is a separate, explicitly-approved Stripe action (see the launch
-- report). Until STRIPE_PRICE_GROWTH_MONTHLY / STRIPE_PRICE_BUSINESS_PRO_MONTHLY
-- are set, checkout for these two tiers fails cleanly (the existing
-- create-checkout-session route already throws on a missing price id) --
-- it does not silently succeed or charge the wrong amount.
--
-- Idempotent: only inserts rows that don't already exist by name.
-- ============================================================================
begin;

insert into public.tiers (id, name, monthly_price, annual_price, features_json)
select
  gen_random_uuid(),
  'Growth',
  19900,
  19900 * 12,
  '[
    "Everything in Network",
    "IronClad badge kit for your truck, social, and print",
    "Ready-made posts and follow-up emails",
    "Text alert the moment you are matched",
    "Monthly performance report"
  ]'::jsonb
where not exists (select 1 from public.tiers where name = 'Growth');

insert into public.tiers (id, name, monthly_price, annual_price, features_json)
select
  gen_random_uuid(),
  'Business Pro',
  29900,
  29900 * 12,
  '[
    "Everything in Growth",
    "Jobsite photography and short-form video support",
    "Monthly social content for your business"
  ]'::jsonb
where not exists (select 1 from public.tiers where name = 'Business Pro');

commit;
