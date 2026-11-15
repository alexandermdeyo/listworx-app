// Stage 1B: content workflow, admin-only routes, disabled scheduler. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  availableActions, nextStatus, isEditable, cleanArticleInput, slugify, CONTENT_STATUSES, CONTENT_ACTIONS,
} from '../lib/content/workflow.ts';
import { runContentScheduler, secretMatches } from '../lib/server/content-scheduler.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('transitions match the database function exactly', () => {
  const sql = read('supabase/proposed/20261115000100_content_workflow.sql');
  for (const a of CONTENT_ACTIONS) {
    for (const s of CONTENT_STATUSES) {
      const to = nextStatus(a, s);
      const m = sql.match(new RegExp(`when p_action = '${a}'\\s+and cur\\.status (?:= '(\\w+)'|in \\(([^)]*)\\))\\s+then '(\\w+)'`));
      assert.ok(m, `sql rule for ${a}`);
      const from = m[1] ? [m[1]] : m[2].split(',').map((x) => x.trim().replace(/'/g, ''));
      assert.equal(to, from.includes(s) ? m[3] : null, `${a} from ${s}`);
    }
  }
});

test('no action publishes; published and scheduled articles cannot be edited here', () => {
  for (const s of CONTENT_STATUSES) for (const a of availableActions(s)) assert.notEqual(nextStatus(a, s), 'published');
  assert.deepEqual(availableActions('published'), []);
  assert.equal(isEditable('approved'), false);
  assert.equal(isEditable('scheduled'), false);
  assert.equal(isEditable('published'), false);
  assert.equal(isEditable('draft'), true);
});

test('input cleaning: whitelist, validation, slug', () => {
  const { values, errors } = cleanArticleInput({ title: '  Hi  ', status: 'published', is_draft: false, audience: 'homeowners', sources: 'https://a.gov\n\nhttps://b.org ' });
  assert.deepEqual(errors, []);
  assert.equal(values.title, 'Hi');
  assert.ok(!('status' in values) && !('is_draft' in values), 'status/is_draft never accepted from the form');
  assert.deepEqual(values.sources, ['https://a.gov', 'https://b.org']);
  assert.ok(cleanArticleInput({ audience: 'everyone' }).errors.length);
  assert.ok(cleanArticleInput({ sources: ['not a url'] }).errors.length);
  assert.ok(cleanArticleInput({ seo_title: 'x'.repeat(121) }).errors.length);
  assert.ok(cleanArticleInput({ featured_image_url: 'javascript:alert(1)' }).errors.length);
  assert.equal(slugify('7 Questions to Ask Before Hiring a Contractor!'), '7-questions-to-ask-before-hiring-a-contractor');
});

test('every content API handler requires an admin before doing anything', () => {
  for (const f of ['app/api/admin/content/route.ts', 'app/api/admin/content/[id]/route.ts', 'app/api/admin/content/[id]/action/route.ts']) {
    const src = read(f);
    const handlers = src.split(/export async function (GET|POST|PATCH|DELETE)/).slice(1);
    assert.ok(handlers.length >= 2, f);
    for (let i = 1; i < handlers.length; i += 2) {
      const body = handlers[i];
      const guard = body.search(/requireAdminRequest\(request\)/);
      const firstDb = body.search(/createSupabaseAdminClient\(\)/);
      assert.ok(guard > 0 && (firstDb === -1 || guard < firstDb), `${f} ${handlers[i - 1]} checks admin first`);
    }
  }
});

test('action route only calls the database function and never publishes', () => {
  const src = read('app/api/admin/content/[id]/action/route.ts');
  assert.match(src, /rpc\('content_apply_action'/);
  assert.match(src, /p_actor_id: adminId/);
  assert.doesNotMatch(src, /is_draft|status: 'published'|\.update\(/);
});

test('create route always saves an unpublished idea or draft', () => {
  const src = read('app/api/admin/content/route.ts');
  assert.match(src, /status: ContentStatus = body\?\.status === 'idea' \? 'idea' : 'draft'/);
  assert.match(src, /is_draft: true,\s*published_at: null/);
});

test('scheduler: disabled by default, dry run even when enabled, secret required', async () => {
  const fake = (enabled, due = []) => ({
    from: (t) => {
      const q = { select: () => q, eq: () => q, lte: () => q, order: () => q, limit: async () => ({ data: due }), maybeSingle: async () => ({ data: { scheduler_enabled: enabled } }) };
      return q;
    },
  });
  assert.deepEqual(await runContentScheduler(fake(false)), { ran: false, reason: 'disabled' });
  const r = await runContentScheduler(fake(true, [{ id: 'x', title: 't', scheduled_for: '2026-01-01' }]));
  assert.equal(r.ran, false);
  assert.equal(r.reason, 'dry_run');
  assert.doesNotMatch(read('lib/server/content-scheduler.ts'), /\.update\(|\.insert\(|rpc\(/, 'scheduler writes nothing');
  assert.equal(secretMatches('a'.repeat(40), 'a'.repeat(40)), true);
  assert.equal(secretMatches('a'.repeat(40), 'b'.repeat(40)), false);
  assert.equal(secretMatches('short', 'short'), false, 'secrets under 32 characters are refused');
  assert.equal(secretMatches(null, 'a'.repeat(40)), false);
  const sql = read('supabase/proposed/20261115000100_content_workflow.sql');
  assert.match(sql, /scheduler_enabled boolean not null default false/);
});

test('no background job is registered', () => {
  const toml = read('netlify.toml');
  assert.doesNotMatch(toml, /schedule/i);
});

test('public blog page renders bodies exactly as before (renderer moved, unchanged)', () => {
  const before = read('tests/fixtures-blog-page-before.txt');
  const oldFn = before.slice(before.indexOf('function renderBody(text: string) {'), before.indexOf('export default async function BlogPostPage')).trim();
  const shared = read('lib/blog-render.tsx');
  const newFn = shared.slice(shared.indexOf('function renderBody(text: string) {')).trim();
  assert.equal(newFn, oldFn);
  const page = read('app/blog/[slug]/page.tsx');
  assert.match(page, /import \{ renderBody \} from '@\/lib\/blog-render';/);
  assert.match(page, /getPublishedPost/);
});

test('newsletter broadcast pause is still in place', () => {
  assert.match(read('app/api/admin/newsletter/send/route.ts'), /if \(!newsletterBroadcastsEnabled\(\)\)/);
});

test('editor remounts per article and clears the saving state after creating', () => {
  const src = read('components/admin/content/ContentManager.tsx');
  assert.match(src, /<ArticleEditor key=\{openId\} id=\{openId\}/);
  assert.match(src, /setBusy\(false\);\s*onCreated\(json\.article\.id\)/);
});
