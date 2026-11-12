// Essential vs optional contractor email (owner decision 6). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSendContractorEmail } from '../lib/notifications/policy.ts';

test('essential notices go out even when optional emails are turned off', () => {
  assert.deepEqual(canSendContractorEmail('essential', { email: 'pro@example.com', optionalEmailsEnabled: false }), { send: true });
});

test('optional emails respect the contractor setting', () => {
  assert.deepEqual(canSendContractorEmail('optional', { email: 'pro@example.com', optionalEmailsEnabled: false }), { send: false, reason: 'opted_out' });
  assert.deepEqual(canSendContractorEmail('optional', { email: 'pro@example.com', optionalEmailsEnabled: true }), { send: true });
});

test('nothing is sent without a valid address on the account', () => {
  for (const email of [null, '', 'not-an-email', ' @x.com']) {
    assert.equal(canSendContractorEmail('essential', { email }).send, false);
  }
});
