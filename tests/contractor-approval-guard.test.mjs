// Phase 1K: regression guard for the contractor approval endpoint's admin
// check (closes the gap found in the IronClad Certification security review —
// no existing test covered this route). Source-shape assertions only, same
// convention as article-html-security.test.mjs and referral-delivery.test.mjs.
// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('approve-application requires an authorized admin before any privileged write', () => {
  const src = read('app/api/approve-application/route.ts');

  assert.match(src, /requireAdminRequest\(request\)/, 'route calls requireAdminRequest(request)');

  // The guard must be the first thing POST does: unauthorized/non-admin callers
  // rejected with 401, before the try block, before any Supabase client exists.
  const body = src.split('export async function POST')[1];
  assert.match(
    body,
    /^\([^)]*\)\s*\{\s*if \(!\(await requireAdminRequest\(request\)\)\)\s*\{\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);\s*\}/,
    'unauthorized/non-admin requests are rejected with 401 as the very first statement in POST'
  );

  const guardIndex = body.search(/requireAdminRequest\(request\)/);
  const adminClientIndex = body.search(/createClient\(/);
  const updateIndex = body.search(/\.update\(\{\s*partner_status:\s*PARTNER_STATUS\.APPROVED/);

  assert.ok(guardIndex !== -1 && adminClientIndex !== -1 && updateIndex !== -1, 'all three markers found in POST');
  assert.ok(guardIndex < adminClientIndex, 'authorization check precedes creation of the service-role client');
  assert.ok(guardIndex < updateIndex, 'authorization check precedes the privileged partner_status write');
});

test('requireAdminRequest itself rejects unauthenticated and non-admin callers', () => {
  const src = read('lib/server/require-admin.ts');

  assert.match(src, /export async function requireAdminRequest/);
  assert.match(
    src,
    /const user = await getRequestUser\(request\);\s*if \(!user\) return null;/,
    'no resolvable session -> null (route treats this as 401)'
  );
  assert.match(
    src,
    /return profile\?\.role === 'ADMIN' \? user\.id : null;/,
    'only role === ADMIN resolves to a truthy admin id; any other role -> null'
  );
});
