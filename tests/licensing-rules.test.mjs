// Jurisdiction-specific license rules (client mirror of license_requirement_for). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLicenseRequirement, checkApplicationLicense, documentPathFromUrl } from '../lib/compliance/licensing.ts';

const sumner = { id: 'sumner', state_code: 'TN' };
const davidson = { id: 'davidson', state_code: 'TN' };
const warren = { id: 'warren-ky', state_code: 'KY' };
const rules = [
  { category_id: 'paint', state_code: 'TN', county_id: null, requirement: 'not_required' },
  { category_id: 'elec', state_code: 'TN', county_id: null, requirement: 'required' },
  { category_id: 'roof', state_code: 'TN', county_id: null, requirement: 'not_required' },
  { category_id: 'roof', state_code: 'TN', county_id: 'davidson', requirement: 'required' },
  { category_id: 'gc', state_code: 'TN', county_id: null, requirement: 'case_by_case' },
];

test('county rule overrides the state rule only in that county', () => {
  assert.equal(resolveLicenseRequirement(rules, 'roof', sumner), 'not_required');
  assert.equal(resolveLicenseRequirement(rules, 'roof', davidson), 'required');
});

test('rules do not carry across states; no rule means admin review, never "required"', () => {
  assert.equal(resolveLicenseRequirement(rules, 'elec', warren), 'needs_review');
  assert.equal(resolveLicenseRequirement(rules, 'handyman', sumner), 'needs_review');
  assert.equal(resolveLicenseRequirement(rules, 'gc', sumner), 'needs_review');
});

test('painter applying without a license is not blocked', () => {
  const r = checkApplicationLicense(rules, ['paint'], [sumner, davidson], false);
  assert.equal(r.ok, true);
  assert.deepEqual(r.required, []);
});

test('licensed trade without a license is blocked and names the trade + county', () => {
  const r = checkApplicationLicense(rules, ['paint', 'roof'], [sumner, davidson], false);
  assert.equal(r.ok, false);
  assert.deepEqual(r.required, [{ categoryId: 'roof', countyId: 'davidson' }]);
  assert.equal(checkApplicationLicense(rules, ['paint', 'roof'], [sumner, davidson], true).ok, true);
});

test('unclear cases go to review without blocking the application', () => {
  const r = checkApplicationLicense(rules, ['gc'], [sumner], false);
  assert.equal(r.ok, true);
  assert.equal(r.review.length, 1);
});

test('rules unavailable (e.g. before the migration): nothing blocked, everything reviewed', () => {
  const r = checkApplicationLicense(null, ['elec'], [sumner], false);
  assert.equal(r.ok, true);
  assert.equal(r.review.length, 1);
});

test('existing application uploads are found by their storage path', () => {
  assert.equal(
    documentPathFromUrl('https://x.supabase.co/storage/v1/object/sign/contractor-documents/u1/applications/license-1.pdf?token=abc'),
    'u1/applications/license-1.pdf'
  );
  assert.equal(documentPathFromUrl('https://x.supabase.co/storage/v1/object/public/logos/a.png'), null);
  assert.equal(documentPathFromUrl(''), null);
});

// ---------- admin decisions per jurisdiction (mirrors DB tests C24-C26) ----------
test('decision precedence: county decision > county rule > statewide decision > state rule', () => {
  const d = (county_id, requirement) => ({ contractor_id: 'E', category_id: 'roof', state_code: 'TN', county_id, requirement });
  assert.equal(resolveLicenseRequirement(rules, 'roof', davidson, [d(null, 'not_required')], 'E'), 'required', 'statewide decision must not beat a county rule');
  assert.equal(resolveLicenseRequirement(rules, 'roof', davidson, [d(null, 'not_required'), d('davidson', 'not_required')], 'E'), 'not_required');
  assert.equal(resolveLicenseRequirement(rules, 'handyman', sumner, [{ ...d(null, 'not_required'), category_id: 'handyman' }], 'E'), 'not_required');
});

test('decisions apply only to their contractor and state; awaiting means review', () => {
  const dec = [{ contractor_id: 'E', category_id: 'handyman', state_code: 'TN', county_id: null, requirement: 'not_required' }];
  assert.equal(resolveLicenseRequirement(rules, 'handyman', warren, dec, 'E'), 'needs_review');
  assert.equal(resolveLicenseRequirement(rules, 'handyman', sumner, dec, 'someone-else'), 'needs_review');
  assert.equal(resolveLicenseRequirement(rules, 'handyman', sumner, [{ ...dec[0], requirement: 'awaiting_determination' }], 'E'), 'needs_review');
});
