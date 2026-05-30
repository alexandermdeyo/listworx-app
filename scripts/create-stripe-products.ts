/**
 * create-stripe-products.ts
 *
 * Creates all Listing Studio products and prices in Stripe LIVE mode.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... npx ts-node scripts/create-stripe-products.ts
 *
 * Or with dotenv (if .env.local has STRIPE_SECRET_KEY):
 *   npx ts-node -r dotenv/config scripts/create-stripe-products.ts
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY ?? '';

if (!key) {
  console.error('❌  STRIPE_SECRET_KEY is not set.');
  process.exit(1);
}

if (!key.startsWith('sk_live_')) {
  console.error(`❌  Key starts with "${key.slice(0, 12)}..." — this is NOT a live key.`);
  console.error('    Set STRIPE_SECRET_KEY to your sk_live_... key and try again.');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-01-28.clover' });

console.log('✅  Live mode confirmed — key starts with sk_live_\n');

// ── Helper ────────────────────────────────────────────────────────────────────

async function createProductWithPrices(
  productData: Stripe.ProductCreateParams,
  prices: Array<{
    nickname: string;
    unit_amount: number; // cents
    interval: 'month' | 'year';
    metadata: Record<string, string>;
  }>
) {
  const product = await stripe.products.create(productData);
  console.log(`  Product created: ${product.id}  (${product.name})`);

  const results: Array<{ nickname: string; priceId: string }> = [];

  for (const p of prices) {
    const price = await stripe.prices.create({
      product:    product.id,
      currency:   'usd',
      unit_amount: p.unit_amount,
      nickname:   p.nickname,
      recurring:  { interval: p.interval },
      metadata:   p.metadata,
    });
    console.log(`    Price created: ${price.id}  (${p.nickname})`);
    results.push({ nickname: p.nickname, priceId: price.id });
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const allPrices: Array<{ label: string; priceId: string }> = [];

  // ── PRODUCT 1 — Listing Studio Starter Agent ────────────────────────────
  console.log('\nCreating Product 1: Listing Studio Starter Agent...');
  const p1 = await createProductWithPrices(
    {
      name: 'Listing Studio Starter Agent',
      description:
        'ListWorx Listing Studio — Starter Agent tier. 8 active listings, 15 content packages, ' +
        '8 flyers, 8 landing pages per month. Brand kit included. No directory listing.',
    },
    [
      {
        nickname:    'Starter Agent Monthly',
        unit_amount: 11900,
        interval:    'month',
        metadata: {
          user_type: 'realtor',
          tier:      'starter_agent',
          interval:  'monthly',
          product:   'listing_studio',
        },
      },
      {
        nickname:    'Starter Agent Annual',
        unit_amount: 118800,
        interval:    'year',
        metadata: {
          user_type: 'realtor',
          tier:      'starter_agent',
          interval:  'annual',
          product:   'listing_studio',
        },
      },
    ]
  );
  allPrices.push(
    { label: 'STARTER AGENT MONTHLY', priceId: p1[0].priceId },
    { label: 'STARTER AGENT ANNUAL',  priceId: p1[1].priceId }
  );

  // ── PRODUCT 2 — Listing Studio Agent Pro ────────────────────────────────
  console.log('\nCreating Product 2: Listing Studio Agent Pro...');
  const p2 = await createProductWithPrices(
    {
      name: 'Listing Studio Agent Pro',
      description:
        'ListWorx Listing Studio — Agent Pro tier. 25 active listings, 50 content packages, ' +
        '30 flyers, 30 landing pages, 3 slideshow videos per month. Full brand kit, ' +
        'directory listing, public profile, priority support.',
    },
    [
      {
        nickname:    'Agent Pro Monthly',
        unit_amount: 29900,
        interval:    'month',
        metadata: {
          user_type: 'realtor',
          tier:      'agent_pro',
          interval:  'monthly',
          product:   'listing_studio',
        },
      },
      {
        nickname:    'Agent Pro Annual',
        unit_amount: 298800,
        interval:    'year',
        metadata: {
          user_type: 'realtor',
          tier:      'agent_pro',
          interval:  'annual',
          product:   'listing_studio',
        },
      },
    ]
  );
  allPrices.push(
    { label: 'AGENT PRO MONTHLY', priceId: p2[0].priceId },
    { label: 'AGENT PRO ANNUAL',  priceId: p2[1].priceId }
  );

  // ── PRODUCT 3 — Listing Studio Elite ────────────────────────────────────
  console.log('\nCreating Product 3: Listing Studio Elite...');
  const p3 = await createProductWithPrices(
    {
      name: 'Listing Studio Elite',
      description:
        'ListWorx Listing Studio — Elite tier. Unlimited listings, 150 content packages, ' +
        '100 flyers, 100 landing pages, 10 slideshow videos per month. Priority directory ' +
        'placement, team seats up to 5, luxury templates, advanced analytics.',
    },
    [
      {
        nickname:    'Elite Monthly',
        unit_amount: 59900,
        interval:    'month',
        metadata: {
          user_type: 'realtor',
          tier:      'elite',
          interval:  'monthly',
          product:   'listing_studio',
        },
      },
      {
        nickname:    'Elite Annual',
        unit_amount: 598800,
        interval:    'year',
        metadata: {
          user_type: 'realtor',
          tier:      'elite',
          interval:  'annual',
          product:   'listing_studio',
        },
      },
    ]
  );
  allPrices.push(
    { label: 'ELITE MONTHLY', priceId: p3[0].priceId },
    { label: 'ELITE ANNUAL',  priceId: p3[1].priceId }
  );

  // ── PRODUCT 4 — Listing Studio Founding Agent Pro ───────────────────────
  console.log('\nCreating Product 4: Listing Studio Founding Agent Pro...');
  const p4 = await createProductWithPrices(
    {
      name: 'Listing Studio Founding Agent Pro',
      description:
        'ListWorx Founding Realtor — Agent Pro locked rate. Annual subscription permanently ' +
        'locked. Rate never increases. Founding Realtor badge included.',
    },
    [
      {
        nickname:    'Founding Agent Pro Annual Locked',
        unit_amount: 82800,
        interval:    'year',
        metadata: {
          user_type:  'realtor',
          tier:       'founding_agent_pro',
          interval:   'annual',
          product:    'listing_studio',
          is_founder: 'true',
        },
      },
    ]
  );
  allPrices.push(
    { label: 'FOUNDING AGENT PRO ANNUAL', priceId: p4[0].priceId }
  );

  // ── PRODUCT 5 — Listing Studio Founding Elite ───────────────────────────
  console.log('\nCreating Product 5: Listing Studio Founding Elite...');
  const p5 = await createProductWithPrices(
    {
      name: 'Listing Studio Founding Elite',
      description:
        'ListWorx Founding Realtor — Elite tier locked rate. Annual subscription permanently ' +
        'locked. Rate never increases. Priority placement included.',
    },
    [
      {
        nickname:    'Founding Elite Annual Locked',
        unit_amount: 142800,
        interval:    'year',
        metadata: {
          user_type:  'realtor',
          tier:       'founding_elite',
          interval:   'annual',
          product:    'listing_studio',
          is_founder: 'true',
        },
      },
    ]
  );
  allPrices.push(
    { label: 'FOUNDING ELITE ANNUAL', priceId: p5[0].priceId }
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('ALL PRICE IDs (copy these into your .env)\n');
  for (const { label, priceId } of allPrices) {
    console.log(`${label}: ${priceId}`);
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('❌  Script failed:', err.message);
  process.exit(1);
});
