// Test sites must not be indexed; production behaviour unchanged unless SITE_NOINDEX=true. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

async function headersWith(value) {
  if (value === undefined) delete process.env.SITE_NOINDEX; else process.env.SITE_NOINDEX = value;
  delete require.cache[require.resolve('../next.config.js')];
  return require('../next.config.js').headers();
}

test('SITE_NOINDEX=true adds a noindex header to every page', async () => {
  const h = await headersWith('true');
  assert.equal(h[0].source, '/:path*');
  assert.deepEqual(h[0].headers[0], { key: 'X-Robots-Tag', value: 'noindex, nofollow' });
});

test('without SITE_NOINDEX (production) no noindex header is added', async () => {
  assert.deepEqual(await headersWith(undefined), []);
  delete process.env.SITE_NOINDEX;
});
