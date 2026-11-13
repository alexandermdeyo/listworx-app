// Fix A: date-only values (expiration dates) display as stored, in any timezone. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDateOnly, daysUntilDateOnly, isPastDateOnly, parseDateOnly } from '../lib/date-only.ts';

test('December 31 displays as December 31', () => {
  assert.equal(formatDateOnly('2027-12-31'), 'Dec 31, 2027');
  assert.equal(formatDateOnly('2027-06-30', { month: 'numeric', day: 'numeric', year: 'numeric' }), '6/30/2027');
  const d = parseDateOnly('2027-12-31');
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate()], [2027, 11, 31]);
});

test('a document is valid through its expiration day', () => {
  const now = new Date(2027, 11, 31, 23, 59);
  assert.equal(daysUntilDateOnly('2027-12-31', now), 0);
  assert.equal(isPastDateOnly('2027-12-31', now), false);
  assert.equal(isPastDateOnly('2027-12-30', now), true);
});

test('empty values', () => {
  assert.equal(formatDateOnly(null), '');
  assert.equal(daysUntilDateOnly(undefined), null);
  assert.equal(isPastDateOnly(''), false);
});
