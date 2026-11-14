// Owner 2026-11-14: Recruiting & Hiring Templates has no live Stripe price, so it is
// hidden everywhere and refused at checkout. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADDON_LIST, getAddonById, getAddonsForTier } from '../lib/tiers-config.ts';

test('recruiting templates is not offered anywhere', () => {
  assert.ok(!ADDON_LIST.some((a) => a.id === 'recruiting_templates'));
  assert.equal(getAddonById('recruiting_templates'), null);
  for (const t of ['basic', 'preferred', 'elite']) {
    assert.ok(!getAddonsForTier(t).some((a) => a.id === 'recruiting_templates'), t);
  }
});

test('other add-ons are still offered', () => {
  for (const id of ['ironclad_badge_kit', 'decal_package_founder', 'decal_package_standard', 'google_business_optimization', 'contractor_profile_video']) {
    assert.ok(getAddonById(id), id);
  }
  assert.equal(getAddonById('decal_package_founder').price, 75);
});

test('checkout refuses unknown/hidden add-ons and records only charged bundled add-ons', () => {
  const src = readFileSync(new URL('../app/api/create-checkout-session/route.ts', import.meta.url), 'utf8');
  assert.match(src, /if \(!getAddonById\(String\(addOnId \|\| ''\)\)\) \{\s*return NextResponse\.json\(\{ error: 'Unknown add-on' \}, \{ status: 400 \}\)/);
  assert.match(src, /chargedBundledAddonIds\.push\(addonId\)/);
  assert.match(src, /bundledAddonIds: chargedBundledAddonIds\.join\(','\)/);
  assert.doesNotMatch(src, /bundledAddonIds: bundledAddonIds\.join/);
});
