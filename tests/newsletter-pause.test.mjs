// Stage 1A: full newsletter sends are paused unless NEWSLETTER_BROADCASTS_ENABLED=true. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('pause switch: only the exact value "true" enables full sends', async () => {
  const { newsletterBroadcastsEnabled } = await import('../lib/newsletter.ts');
  const prev = process.env.NEWSLETTER_BROADCASTS_ENABLED;
  for (const [v, want] of [[undefined, false], ['', false], ['false', false], ['TRUE', false], ['1', false], ['true', true]]) {
    if (v === undefined) delete process.env.NEWSLETTER_BROADCASTS_ENABLED; else process.env.NEWSLETTER_BROADCASTS_ENABLED = v;
    assert.equal(newsletterBroadcastsEnabled(), want, String(v));
  }
  if (prev === undefined) delete process.env.NEWSLETTER_BROADCASTS_ENABLED; else process.env.NEWSLETTER_BROADCASTS_ENABLED = prev;
});

test('send route: refuses a full send before locking, loading subscribers or sending', () => {
  const src = read('app/api/admin/newsletter/send/route.ts');
  const pause = src.indexOf('if (!newsletterBroadcastsEnabled())');
  assert.ok(pause > 0, 'pause check present');
  assert.ok(pause > src.indexOf('if (testTo)'), 'test sends still allowed');
  assert.ok(pause < src.indexOf("update({ status: 'sending'"), 'checked before the campaign is locked');
  assert.ok(pause < src.indexOf("from('newsletter_subscribers')"), 'checked before subscribers are loaded');
  assert.ok(pause < src.lastIndexOf('await sendNewsletterBatch('), 'checked before the bulk send');
  assert.match(src, /status: 423/);
  assert.ok(src.indexOf('const auth = await requireAdmin(request)') < pause, 'admin check still first');
});

test('signup, unsubscribe and transactional email code are untouched by the pause', () => {
  for (const f of ['app/api/newsletter/subscribe/route.ts', 'app/api/newsletter/unsubscribe/route.ts', 'lib/server/referral-delivery.ts', 'lib/server/notify.ts']) {
    assert.doesNotMatch(read(f), /newsletterBroadcastsEnabled|NEWSLETTER_BROADCASTS_ENABLED/, f);
  }
});

test('admin screen disables the Send button while paused', () => {
  const src = read('components/admin/NewsletterCampaigns.tsx');
  assert.match(src, /disabled=\{busy === c\.id \|\| activeCount === 0 \|\| !broadcastsEnabled\}/);
  assert.match(src, /useState\(false\)/);
});
