// Server routes must identify the caller with auth.getUser() (verified by Supabase Auth),
// never auth.getSession(), which returns whatever the cookie says. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Still on getSession(), each pending a separate decision (see the approval report):
const PENDING = new Set([
  'app/api/create-portal-session/route.ts',        // Stripe billing — needs owner approval to touch
  'app/api/listing-studio/create-checkout/route.ts', // Stripe checkout — needs owner approval to touch
  'app/api/requestor/select-contractor/route.ts',  // fixed in PR #35
]);

function routes(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? routes(p) : /\.(ts|tsx|js)$/.test(name) ? [p] : [];
  });
}

test('no server route trusts an unverified session cookie', () => {
  const offenders = routes('app/api')
    .filter((f) => !PENDING.has(f))
    .filter((f) => /\.auth\.getSession\(\)/.test(readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '')));
  assert.deepEqual(offenders, []);
});
