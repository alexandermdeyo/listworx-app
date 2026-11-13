// Launch blocker: contractors cannot mark their own documents approved. Run: npm test
// (The database rules are tested in supabase/proposed/test/40_document_guard_tests.sql.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPastDateOnly } from '../lib/date-only.ts';

test('dashboard uploads are saved as pending, never approved', () => {
  const src = readFileSync('app/contractor-dashboard/DocumentsTab.tsx', 'utf8');
  assert.ok(!/status:\s*'APPROVED'/.test(src), 'DocumentsTab still writes APPROVED');
  assert.ok(/status:\s*'PENDING'/.test(src));
});

test('public profile counts only approved documents as verified', () => {
  const src = readFileSync('app/contractors/[id]/page.tsx', 'utf8');
  const body = src.slice(src.indexOf('function isCredentialVerified'), src.indexOf('async function getPublicProfile'));
  // evaluate the function body on sample inputs
  const fn = new Function('isPastDateOnly', `${body.replace(/\(credential: Credential\)/, '(credential)')}; return isCredentialVerified;`)(isPastDateOnly);
  const future = '2999-01-01';
  assert.equal(fn({ status: 'APPROVED', expiration_date: future }), true);
  assert.equal(fn({ status: 'PENDING', expiration_date: future }), false);
  assert.equal(fn({ status: null, expiration_date: future }), false, 'blank status must not count');
  assert.equal(fn({ status: '', expiration_date: null }), false);
  assert.equal(fn({ status: 'APPROVED', expiration_date: '2000-01-01' }), false, 'expired must not count');
});
