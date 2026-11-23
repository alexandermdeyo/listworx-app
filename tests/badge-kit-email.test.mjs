// Member welcome + badge kit email: content rules, snippet, and trigger points. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  contractorBadgeKitEmail, badgeKitSnippet, BADGE_KIT_FILES, BADGE_KIT_SUBJECT,
} from '../lib/email-templates.ts';

test('badge kit images exist on the site and load from listworx.co', () => {
  for (const f of Object.values(BADGE_KIT_FILES)) {
    assert.ok(existsSync(`public${f.path}`), f.path);
    assert.ok(existsSync(`public${f.fullSize}`), f.fullSize);
  }
  const { html } = contractorBadgeKitEmail({ ownerName: 'Pat Doe', companyName: 'Doe Roofing' });
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length >= 4);
  for (const s of srcs) assert.ok(s.startsWith('https://listworx.co/'), s);
  assert.ok(!/cid:|data:image/.test(html), 'no attachments or inline data images');
});

test('uncertified members get the IronClad Standards shield, never the Certified badge', () => {
  const { html, text } = contractorBadgeKitEmail({ ownerName: 'Pat', companyName: 'Doe Roofing', certified: false });
  assert.ok(html.includes(BADGE_KIT_FILES.standards.path));
  assert.ok(!html.includes(BADGE_KIT_FILES.certified.path));
  assert.ok(!/Certified Partner/i.test(html) && !/Certified Partner/i.test(text));
  const snip = badgeKitSnippet({ profileUrl: null, certified: false });
  assert.ok(snip.html.includes(BADGE_KIT_FILES.standards.path));
});

test('certified members also get the Certified badge, and it goes in their snippet', () => {
  const { html } = contractorBadgeKitEmail({ ownerName: 'Pat', certified: true });
  assert.ok(html.includes(BADGE_KIT_FILES.certified.path) && html.includes(BADGE_KIT_FILES.standards.path));
  assert.ok(badgeKitSnippet({ certified: true }).html.includes(BADGE_KIT_FILES.certified.path));
});

test('snippet links to the profile page, falling back to listworx.co, with a plain-text version', () => {
  const live = badgeKitSnippet({ profileUrl: 'https://listworx.co/contractor/doe-roofing' });
  assert.match(live.html, /^<a href="https:\/\/listworx\.co\/contractor\/doe-roofing"[^>]*><img src="https:\/\/listworx\.co\/brand\/badge-kit\/[^"]+" alt="[^"]+" width="\d+" height="\d+"[^>]*><\/a>$/);
  assert.ok(live.text.endsWith('https://listworx.co/contractor/doe-roofing'));
  const fallback = badgeKitSnippet({ profileUrl: null });
  assert.ok(fallback.html.startsWith('<a href="https://listworx.co"'));
  const { html } = contractorBadgeKitEmail({ ownerName: 'Pat' });
  assert.ok(html.includes('&lt;a href=&quot;https://listworx.co&quot;'), 'snippet shown as escaped, copyable code');
});

test('welcome copy: free, no per-lead fees, max 3 contractors, trust and integrity, dashboard and apply links', () => {
  const { subject, html, text } = contractorBadgeKitEmail({ ownerName: 'Pat Doe', companyName: 'Doe <Roofing>' });
  assert.equal(subject, BADGE_KIT_SUBJECT);
  for (const s of ['free', 'per-lead fees', 'no more than 3', 'trust and integrity', 'Alex Deyo']) {
    assert.ok(text.includes(s), s);
  }
  assert.ok(html.includes('https://listworx.co/contractor-dashboard') && html.includes('https://listworx.co/apply'));
  assert.ok(html.includes('Doe &lt;Roofing&gt;'), 'company name is escaped');
  assert.ok(!/founding/i.test(text), 'no Founding Partner language');
  assert.ok(html.includes('.kit-tile{display:block!important'), 'tiles stack on phones');
});

test('sent once per contractor after activation; approval flow untouched', () => {
  const helper = readFileSync('lib/server/badge-kit-email.ts', 'utf8');
  assert.ok(helper.includes(".eq('action', BADGE_KIT_SENT_ACTION)") && helper.includes("from('audit_logs').insert"));
  assert.ok(helper.includes("profile.partner_status !== 'active'"));
  const free = readFileSync('app/api/activate-free-membership/route.ts', 'utf8');
  assert.ok(free.includes('await sendBadgeKitEmailOnce(admin, profile.id);'));
  const hook = readFileSync('app/api/stripe-webhook/route.ts', 'utf8');
  assert.equal((hook.match(/await sendBadgeKitEmailOnce\(getSupabase\(\), contractorId\);/g) || []).length, 2);
  assert.ok(!readFileSync('app/api/approve-application/route.ts', 'utf8').includes('badge'));
});
