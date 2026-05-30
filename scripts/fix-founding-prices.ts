/**
 * fix-founding-prices.ts
 *
 * 1. Finds "Listing Studio Founding Agent Pro" and "Listing Studio Founding Elite" products.
 * 2. Archives the old incorrect prices.
 * 3. Creates new correct prices ($2,388/yr and $4,788/yr).
 *
 * Usage (from /Users/alexdeyo/listworx-app):
 *   STRIPE_SECRET_KEY=sk_live_... npx ts-node scripts/fix-founding-prices.ts
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY ?? '';

if (!key) {
  console.error('❌  STRIPE_SECRET_KEY is not set.');
  process.exit(1);
}

if (!key.startsWith('sk_live_')) {
  console.error(`❌  Key starts with "${key.slice(0, 12)}..." — NOT a live key. Aborting.`);
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });

console.log('✅  Live mode confirmed — key starts with sk_live_\n');

const OLD_PRICE_FOUNDING_AGENT_PRO = 'price_1Tb8Kb7JcUvuHoDORYkTYNxd';
const OLD_PRICE_FOUNDING_ELITE     = 'price_1Tb8Kc7JcUvuHoDOyicZkK9N';

async function main() {

  // ── 1. Find the two products by name ────────────────────────────────────
  console.log('Looking up products...');

  const products = await stripe.products.list({ limit: 100, active: true });

  const foundingAgentPro = products.data.find(
    (p) => p.name === 'Listing Studio Founding Agent Pro'
  );
  const foundingElite = products.data.find(
    (p) => p.name === 'Listing Studio Founding Elite'
  );

  if (!foundingAgentPro) {
    console.error('❌  Could not find product "Listing Studio Founding Agent Pro"');
    process.exit(1);
  }
  if (!foundingElite) {
    console.error('❌  Could not find product "Listing Studio Founding Elite"');
    process.exit(1);
  }

  console.log(`  Found: ${foundingAgentPro.id}  (${foundingAgentPro.name})`);
  console.log(`  Found: ${foundingElite.id}  (${foundingElite.name})\n`);

  // ── 2. Archive old incorrect prices ─────────────────────────────────────
  console.log('Archiving old prices...');

  await stripe.prices.update(OLD_PRICE_FOUNDING_AGENT_PRO, { active: false });
  console.log(`  Archived: ${OLD_PRICE_FOUNDING_AGENT_PRO}  (old Founding Agent Pro)`);

  await stripe.prices.update(OLD_PRICE_FOUNDING_ELITE, { active: false });
  console.log(`  Archived: ${OLD_PRICE_FOUNDING_ELITE}  (old Founding Elite)\n`);

  // ── 3. Create new correct prices ─────────────────────────────────────────
  console.log('Creating new prices...');

  const newAgentProPrice = await stripe.prices.create({
    product:     foundingAgentPro.id,
    currency:    'usd',
    unit_amount: 238800,   // $2,388.00
    nickname:    'Founding Agent Pro Annual Locked',
    recurring:   { interval: 'year' },
    metadata: {
      user_type:  'realtor',
      tier:       'founding_agent_pro',
      interval:   'annual',
      product:    'listing_studio',
      is_founder: 'true',
    },
  });
  console.log(`  Created: ${newAgentProPrice.id}  (Founding Agent Pro Annual Locked — $2,388/yr)`);

  const newElitePrice = await stripe.prices.create({
    product:     foundingElite.id,
    currency:    'usd',
    unit_amount: 478800,   // $4,788.00
    nickname:    'Founding Elite Annual Locked',
    recurring:   { interval: 'year' },
    metadata: {
      user_type:  'realtor',
      tier:       'founding_elite',
      interval:   'annual',
      product:    'listing_studio',
      is_founder: 'true',
    },
  });
  console.log(`  Created: ${newElitePrice.id}  (Founding Elite Annual Locked — $4,788/yr)\n`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('─'.repeat(60));
  console.log('NEW PRICE IDs\n');
  console.log(`FOUNDING AGENT PRO ANNUAL: ${newAgentProPrice.id}`);
  console.log(`FOUNDING ELITE ANNUAL:     ${newElitePrice.id}`);
  console.log('─'.repeat(60) + '\n');
  console.log('Add these to .env.local and Netlify:');
  console.log(`NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_PRO_ANNUAL=${newAgentProPrice.id}`);
  console.log(`NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_ELITE_ANNUAL=${newElitePrice.id}`);
}

main().catch((err) => {
  console.error('❌  Script failed:', err.message);
  process.exit(1);
});
