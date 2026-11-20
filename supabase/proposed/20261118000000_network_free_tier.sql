-- ============================================================================
-- PROPOSED — NOT APPLIED. Adds the "Network" ($0) tier row that Free Network
-- membership activation (app/api/activate-free-membership/route.ts) looks up
-- by name at request time. Additive only: no existing tiers row, subscription
-- row, or contractor_profiles row is touched, and no existing RLS policy or
-- column is changed.
--
-- Why a new tiers row instead of reusing one of the existing $0 "Basic
-- Partner" / "Preferred Partner" / "Elite Partner" rows (seeded 2026-11-14):
-- those three are the fallback targets `resolveTierId()` in
-- app/api/stripe-webhook/route.ts resolves the PAID basic/preferred/elite
-- checkout slugs to -- reusing one for the free tier would make a paid
-- Stripe checkout and a free, no-Stripe activation resolve to the exact same
-- tier id, which is exactly the kind of ambiguity that would make it hard to
-- tell a real paid subscription apart from a free one later. A separate,
-- distinctly-named row keeps the two completely separate.
--
-- Idempotent: only inserts if no row named exactly 'Network' already exists
-- (no unique constraint on tiers.name to ON CONFLICT against).
-- ============================================================================
begin;

insert into public.tiers (id, name, monthly_price, annual_price, features_json)
select
  gen_random_uuid(),
  'Network',
  0,
  0,
  '[
    "Reviewed against IronClad Standards before your first referral",
    "Matched with homeowners in your trade and county",
    "Verified reviews from real jobs",
    "No per-lead fees, ever",
    "Equal referral consideration, same as every other tier"
  ]'::jsonb
where not exists (
  select 1 from public.tiers where name = 'Network'
);

commit;
