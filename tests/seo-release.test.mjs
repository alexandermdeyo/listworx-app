// SEO release (PR #34 on launched main). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
function walk(dir, out = []) {
  for (const f of readdirSync(new URL(`../${dir}`, import.meta.url))) {
    const p = join(dir, f);
    if (statSync(new URL(`../${p}`, import.meta.url)).isDirectory()) walk(p, out);
    else if (/\.(tsx?|ts)$/.test(f)) out.push(p);
  }
  return out;
}

test('robots keeps the SITE_NOINDEX switch and the crawler policy', () => {
  const src = read('app/robots.ts');
  assert.match(src, /process\.env\.SITE_NOINDEX === 'true'/);
  assert.match(src, /if \(NOINDEX\) \{\s*return \{ rules: \{ userAgent: '\*', disallow: '\/' \} \};/);
  assert.match(src, /'GPTBot', 'ClaudeBot', 'Google-Extended'/);
  assert.match(src, /sitemap: 'https:\/\/listworx\.co\/sitemap\.xml'/);
});

test('public copy makes no background-check or guarantee claims', () => {
  for (const f of [...walk('app'), ...walk('components'), 'lib/seo.ts']) {
    if (f.includes('/admin') || f.includes('/api/')) continue;
    const s = read(f);
    assert.doesNotMatch(s, /background-checked|guaranteed (jobs|work|leads)/i, f);
  }
});

test('contractor profiles: one canonical (slug or id), no tier or certification claim in meta', () => {
  const src = read('app/contractors/[id]/page.tsx');
  assert.match(src, /contractors\/\$\{data\.profile\.profile_slug \|\| data\.profile\.id\}/);
  assert.match(src, /robots: \{ index: false, follow: true \}/, 'missing profiles are noindex');
  const meta = src.slice(src.indexOf('export async function generateMetadata'));
  const strings = (meta.slice(0, 1500).match(/`[^`]*`/g) || []).join(' ');
  assert.ok(strings.includes('contractor in the ListWorx network'));
  assert.doesNotMatch(strings, /certified|tier|elite|verified/i);
});

test('mobile: pinch-zoom allowed', () => {
  assert.doesNotMatch(read('app/layout.tsx'), /maximum-scale/);
});

test('public contact address is adeyo@listworx.co (no support@ mailbox)', () => {
  for (const f of [...walk('app'), ...walk('components'), ...walk('lib')]) assert.doesNotMatch(read(f), /support@listworx\.co/, f);
  assert.match(read('components/Footer.tsx'), /'company_support_email', 'adeyo@listworx\.co'/);
});

test('realtor emails: no blanket certification claim; badge only when admin-certified', () => {
  const fn = read('supabase/functions/send-realtor-email/index.ts');
  assert.doesNotMatch(fn, /All contractors are IronClad|IronClad-certified contractor|IronClad Contractor\$\{|Standards Certified Partner Network|maintains verified licensing/);
  assert.match(fn, /c\.ironcladCertified === true \? `<p/);
  assert.match(fn, /agreed to follow the IronClad Standards/);
  const del = read('lib/server/referral-delivery.ts');
  assert.match(del, /select\('id, logo_url, profile_slug, ironclad_certified'\)/);
  assert.match(del, /certifiedMap\[p\.id\] = p\.ironclad_certified === true/);
  assert.match(del, /ironcladCertified: certifiedMap\[c\.id\] === true/);
});
