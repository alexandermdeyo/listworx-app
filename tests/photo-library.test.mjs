// Stage 2: photo library. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  readImageInfo, dhashFromGrid, hammingDistance, findDuplicates, photoWarnings, approvalProblems, cleanPhotoInput,
  cleanTags, libraryPath, parseCsv, manifestSuggestions, matchesSearch, articleImageUrls, AI_CHECKLIST, MAX_PHOTO_BYTES,
} from '../lib/photos/library.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const bytes = (p) => new Uint8Array(readFileSync(new URL(`../${p}`, import.meta.url)));

test('file type and pixel size are read from the file itself', () => {
  for (const f of ['tiny.png', 'tiny.jpg', 'tiny-progressive.jpg', 'tiny.webp', 'tiny-lossless.webp']) {
    const info = readImageInfo(bytes(`tests/fixtures/photos/${f}`));
    assert.ok(info, f);
    assert.equal(info.width, 321, f);
    assert.equal(info.height, 123, f);
  }
  assert.equal(readImageInfo(bytes('tests/fixtures/photos/tiny.png')).mime, 'image/png');
  assert.equal(readImageInfo(bytes('tests/fixtures/photos/tiny.jpg')).mime, 'image/jpeg');
  assert.equal(readImageInfo(bytes('tests/fixtures/photos/tiny.webp')).mime, 'image/webp');
  assert.equal(readImageInfo(new TextEncoder().encode('<svg onload=alert(1)>')), null, 'SVG/HTML rejected');
  assert.equal(readImageInfo(new TextEncoder().encode('GIF89a......')), null, 'GIF not accepted');
  assert.equal(readImageInfo(new Uint8Array([0xff, 0xd8, 0xff])), null, 'truncated JPEG');
});

test('similarity fingerprint (difference hash) and distance', () => {
  const grid = Array.from({ length: 72 }, (_, i) => (i % 9) * 10); // brightness rises left to right
  assert.equal(dhashFromGrid(grid), '0000000000000000');
  const flipped = grid.map((v) => 100 - v);
  assert.equal(dhashFromGrid(flipped), 'ffffffffffffffff');
  assert.equal(hammingDistance('0000000000000000', 'ffffffffffffffff'), 64);
  assert.equal(hammingDistance('a5a5a5a5a5a5a5a5', 'a5a5a5a5a5a5a5a5'), 0);
  assert.equal(hammingDistance('0000000000000000', '0000000000000007'), 3);
  assert.throws(() => dhashFromGrid([1, 2, 3]));
});

test('duplicates: identical files and look-alikes, archived ignored', () => {
  const a = { id: 'a', sha256: 'x'.repeat(64), dhash: '0000000000000000' };
  const b = { id: 'b', sha256: 'x'.repeat(64), dhash: '0000000000000000' };          // same bytes
  const c = { id: 'c', sha256: 'y'.repeat(64), dhash: '000000000000000f' };          // 4 bits away: look-alike
  const d = { id: 'd', sha256: 'z'.repeat(64), dhash: 'ffffffffffffffff' };          // different
  const e = { id: 'e', sha256: 'x'.repeat(64), dhash: null, archived: true };        // archived copy
  const r = findDuplicates([a, b, c, d, e]);
  assert.deepEqual(r.a.exact, ['b']);
  assert.deepEqual(r.a.similar, [{ id: 'c', distance: 4 }]);
  assert.deepEqual(r.d, { exact: [], similar: [] });
  assert.equal(r.e, undefined);
});

test('warnings come only from facts we know (size, metadata, fingerprints)', () => {
  const base = { width: 1536, height: 1024, is_ai_generated: false, usage_rights: 'owned', alt_text: 'A roofer on a ladder', intended_uses: ['blog_featured'], quality_flags: [] };
  assert.deepEqual(photoWarnings(base), []);
  const tiny = photoWarnings({ ...base, width: 301, height: 165 });
  assert.equal(tiny[0].code, 'very_low_res');
  assert.equal(tiny[0].level, 'block');
  assert.equal(photoWarnings({ ...base, width: 762, height: 506 })[0].code, 'low_res');
  assert.equal(photoWarnings({ ...base, width: 1000, height: 600 })[0].level, 'warn', 'featured use + under 1200 = warn');
  const ai = photoWarnings({ ...base, is_ai_generated: true, usage_rights: 'unknown', alt_text: '', quality_flags: ['unnatural_details'] }, { exact: ['q'], similar: [{ id: 'r', distance: 3 }] });
  const codes = ai.map((w) => w.code);
  for (const c of ['ai', 'rights_unknown', 'no_alt', 'exact_duplicate', 'near_duplicate', 'flag_unnatural_details']) assert.ok(codes.includes(c), c);
  const all = ai.map((w) => w.text).join(' ');
  assert.doesNotMatch(all, /detected (a )?face|AI detected|automatically (checked|inspected)/i, 'no claim of visual inspection');
});

test('approval requirements mirror the database', () => {
  const p = { width: 1536, height: 1024, is_ai_generated: true, usage_rights: 'ai_generated', alt_text: 'x', intended_uses: [], quality_flags: [] };
  assert.deepEqual(approvalProblems(p, {}), ['Complete the AI review checklist']);
  const ok = Object.fromEntries(AI_CHECKLIST.map((c) => [c.key, true]));
  assert.deepEqual(approvalProblems(p, ok), []);
  assert.deepEqual(approvalProblems({ ...p, is_ai_generated: false, usage_rights: 'unknown', alt_text: ' ' }, {}), ['Add alt text', 'Record the usage rights']);
  const sql = read('supabase/proposed/20261116000100_photo_library.sql');
  for (const c of AI_CHECKLIST) assert.match(sql, new RegExp(`review_checklist ->> '${c.key}'`), `db enforces ${c.key}`);
  assert.match(sql, /new\.status := 'pending';/, 'inserts are forced to pending');
});

test('metadata input: whitelist and validation (never approval or file fields)', () => {
  const { values, errors } = cleanPhotoInput({
    title: '  Roof inspection ', alt_text: 'Roofer', tags: 'Roofing, C08 , roofing', intended_uses: ['blog_featured', 'social'],
    usage_rights: 'ai_generated', is_ai_generated: true, focus_x: '40', focus_y: 12.6, quality_flags: ['crop_risk'],
    status: 'approved', reviewed_by: 'x', sha256: 'y', storage_path: 'library/x', public_url: 'z', width: 5,
  });
  assert.deepEqual(errors, []);
  assert.equal(values.title, 'Roof inspection');
  assert.deepEqual(values.tags, ['roofing', 'c08']);
  assert.equal(values.focus_x, 40);
  assert.equal(values.focus_y, 13);
  for (const k of ['status', 'reviewed_by', 'sha256', 'storage_path', 'public_url', 'width']) assert.ok(!(k in values), k);
  assert.ok(cleanPhotoInput({ intended_uses: ['billboard'] }).errors.length);
  assert.ok(cleanPhotoInput({ usage_rights: 'stolen' }).errors.length);
  assert.ok(cleanPhotoInput({ is_ai_generated: 'yes' }).errors.length);
  assert.ok(cleanPhotoInput({ focus_y: 101 }).errors.length);
  assert.ok(cleanPhotoInput({ alt_text: 'x'.repeat(301) }).errors.length);
  assert.ok(cleanPhotoInput({ quality_flags: ['fine'] }).errors.length);
  assert.equal(cleanTags(Array(50).fill(0).map((_, i) => `t${i}`)).length, 30);
});

test('originals get unique, safe names in private storage (originals/)', () => {
  const p = libraryPath('Tennessee Contractor License Review.PNG', '11111111-2222-4333-8444-555555555555', new Date('2026-11-15T00:00:00Z'));
  assert.equal(p, 'originals/2026/11/11111111-2222-4333-8444-555555555555-Tennessee-Contractor-License-Review.png');
  assert.match(libraryPath('../../etc/passwd.jpeg', '11111111-2222-4333-8444-555555555555'), /^originals\/\d{4}\/\d{2}\/[0-9a-f-]{36}-etc-passwd\.jpg$/);
  const register = read('app/api/admin/photos/register/route.ts');
  assert.match(register, /storage\.from\(PRIVATE_BUCKET\)\.download\(path\)/, 'registers from private storage');
  assert.doesNotMatch(register, /public_url/, 'registration never creates a public address');
  const m = register.match(/!\/(\^originals[^/]*(?:\/[^/]*)*?)\/\.test\(path\)/);
  assert.ok(m, 'register validates the path');
  assert.ok(new RegExp(m[1].replace(/\\\//g, '/')).test(p));
});

test('import list (IMAGE_MANIFEST.csv) fills in metadata by file name', () => {
  const csv = 'article_id,audience,title,role,filename,native_width,native_height,publish_ready,source_sheet,location\n' +
    'C08,Contractors,"How to Win Roofing Jobs, Fast",featured_reference,Contractors/C08/C08_featured_reference.jpg,301,165,NO - source cropped from contact sheet,A,row 1 col 1\r\n' +
    'C08,Contractors,"How to Win Roofing Jobs, Fast",high_resolution_editorial,Contractors/C08/C08_high_resolution_editorial.jpg,1536,1024,REVIEW,,\n';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, 'How to Win Roofing Jobs, Fast');
  const s = manifestSuggestions(rows, 'C08_featured_reference.jpg');
  assert.equal(s.category, 'Contractors');
  assert.deepEqual(s.intended_uses, ['blog_featured']);
  assert.deepEqual(s.tags, ['c08', 'featured_reference', 'contractors']);
  assert.match(s.import_note, /^NO/);
  assert.deepEqual(manifestSuggestions(rows, 'C08_high_resolution_editorial.jpg').intended_uses, []);
  assert.equal(manifestSuggestions(rows, 'other.jpg'), null);
});

test('search across file name, title, category, tags and alt text', () => {
  const a = { original_filename: 'C08_Roof_Inspection.png', title: 'Roof inspection', description: null, category: 'Contractors', tags: ['roofing', 'c08'], intended_uses: [], status: 'approved', is_ai_generated: true, alt_text: 'A roofer on a ladder', archived: false };
  assert.ok(matchesSearch(a, 'roof'));
  assert.ok(matchesSearch(a, 'contractors ladder'));
  assert.ok(matchesSearch(a, 'C08'));
  assert.ok(!matchesSearch(a, 'kitchen'));
  assert.ok(matchesSearch(a, '   '));
});

test('photos used by an article are found for the publishing check', () => {
  const body = 'Text\n\n<img src="https://s/x/library/a.webp" alt="a" />\n\n<IMG SRC=\'https://s/x/library/b.jpg\'>\n\n<img alt="c" src=https://s/x/c.png>';
  assert.deepEqual(articleImageUrls('https://s/x/hero.jpg', body), ['https://s/x/hero.jpg', 'https://s/x/library/a.webp', 'https://s/x/library/b.jpg', 'https://s/x/c.png']);
  assert.deepEqual(articleImageUrls(null, null), []);
});

test('publishing paths refuse unapproved library photos; pickers only offer approved ones', () => {
  const action = read('app/api/admin/content/[id]/action/route.ts');
  assert.match(action, /action === 'approve' \|\| action === 'schedule'[\s\S]*unapprovedLibraryPhotos/);
  const blog = read('app/api/blog/route.ts');
  assert.match(blog.split('export async function POST')[1].split('export async function')[0], /if \(is_published\)[\s\S]*unapprovedLibraryPhotos/);
  assert.match(blog.split('export async function PATCH')[1].split('export async function')[0], /willBeLive[\s\S]*unapprovedLibraryPhotos/);
});

test('originals are preserved: private bucket, no overwrite, only public copies are ever removed', () => {
  const uploader = read('components/admin/photos/PhotoUploader.tsx');
  assert.match(uploader, /upsert: false/);
  assert.match(uploader, /storage\.from\('photo-library'\)\.upload/, 'uploads go to the private bucket');
  assert.match(uploader, /\/api\/admin\/photos\/check/, 'exact duplicates are checked before uploading');
  const server = read('lib/photos/server.ts');
  const removes = server.match(/\.remove\(/g) || [];
  assert.equal(removes.length, 1, 'exactly one removal in the photo code');
  const idx = server.indexOf('.remove(');
  const before = server.slice(Math.max(0, idx - 1500), idx);
  assert.match(before, /startsWith\('library\/'\)/, 'only paths under library/ (public copies)');
  assert.match(before, /published\.length[\s\S]*retained/, 'never while a published article uses it');
  assert.match(server.slice(idx - 80, idx + 20), /storage\.from\(PUBLIC_BUCKET\)\.remove/, 'only from the public bucket');
  assert.doesNotMatch(server, /from\(PRIVATE_BUCKET\)\.remove/);
  const files = ['lib/photos/library.ts', 'lib/photos/browser.ts',
    ...readdirSync(new URL('../components/admin/photos/', import.meta.url)).map((f) => `components/admin/photos/${f}`),
    'app/api/admin/photos/route.ts', 'app/api/admin/photos/check/route.ts', 'app/api/admin/photos/register/route.ts',
    'app/api/admin/photos/[id]/route.ts', 'app/api/admin/photos/[id]/review/route.ts', 'app/api/admin/photos/issues/route.ts',
    'app/api/admin/photos/secure-older/route.ts'];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /\.remove\(|\.delete\(\)|upsert:\s*true|unpublish\w*\(|is_draft:\s*true/, `${f} never deletes, overwrites or unpublishes`);
  }
  assert.doesNotMatch(server, /upsert:\s*true|is_draft:\s*true|\.from\('blog_posts'\)\.update/, 'never overwrites or edits articles');
  assert.equal(MAX_PHOTO_BYTES, 25 * 1024 * 1024);
  const sql = read('supabase/proposed/20261116000100_photo_library.sql');
  assert.match(sql, /grant select, insert, update on public\.photo_assets to service_role;/, 'no delete grant');
  const priv = read('supabase/proposed/20261116000200_photo_private_storage.sql');
  assert.match(priv, /'photo-library', 'photo-library', false/, 'private bucket');
  assert.doesNotMatch(priv, /for (update|delete)[^;]*photo-library/i, 'no overwrite/delete storage rules');
  assert.match(read('supabase/proposed/20261116000200_photo_private_storage.rollback.sql'), /never deleted/);
});

test('pickers only offer approved photos with a live public copy; problems are surfaced', () => {
  assert.match(read('components/admin/photos/PhotoPicker.tsx'), /publishable: '1'/);
  const list = read('app/api/admin/photos/route.ts');
  assert.match(list, /publishable && !\(a\.status === 'approved' && !a\.archived && a\.public_copy_live\)/);
  const server = read('lib/photos/server.ts');
  assert.match(server, /\.filter\(\(p\) => p\.status !== 'approved' \|\| p\.archived\)/, 'publish guard covers rejected, pending and archived');
  assert.match(server, /code: 'used_while_unapproved'/);
  assert.match(read('components/admin/content/ContentManager.tsx'), /<PhotoIssuesBanner \/>/, 'Content dashboard warning');
  assert.match(read('components/admin/photos/PhotoLibrary.tsx'), /<PhotoIssuesBanner/, 'Photo Library warning');
  assert.match(read('components/admin/photos/PhotoDetail.tsx'), /data-testid="photo-in-use-alert"/);
});

test('every photo API checks for an admin before touching data', () => {
  for (const f of ['app/api/admin/photos/route.ts', 'app/api/admin/photos/check/route.ts', 'app/api/admin/photos/register/route.ts', 'app/api/admin/photos/[id]/route.ts', 'app/api/admin/photos/[id]/review/route.ts', 'app/api/admin/photos/issues/route.ts', 'app/api/admin/photos/secure-older/route.ts']) {
    const handlers = read(f).split(/export async function (GET|POST|PATCH|DELETE)/).slice(1);
    assert.ok(handlers.length >= 2, f);
    for (let i = 1; i < handlers.length; i += 2) {
      const body = handlers[i];
      const guard = body.search(/requireAdminRequest\(request\)/);
      const firstDb = body.search(/createSupabaseAdminClient\(\)|loadLibrary\(|photoIssues\(/);
      assert.ok(guard > 0 && (firstDb === -1 || guard < firstDb), `${f} ${handlers[i - 1]}`);
    }
  }
});

test('no paid image services or AI calls', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    assert.doesNotMatch(dep, /openai|anthropic|cloudinary|imgix|replicate|rekognition|vision|sharp/i, dep);
  }
  const src = ['lib/photos/library.ts', 'lib/photos/server.ts', 'lib/photos/browser.ts', 'components/admin/photos/PhotoUploader.tsx'].map(read).join('\n');
  assert.doesNotMatch(src, /https:\/\/api\.(openai|anthropic)|render\/image|transform=/i);
});

test('a photo can be rejected without typing a reason', () => {
  const route = read('app/api/admin/photos/[id]/review/route.ts');
  const detail = read('components/admin/photos/PhotoDetail.tsx');
  assert.match(route, /decision === 'reject' \? NO_REASON_NOTE : null/, 'empty rejection note gets a default');
  assert.match(detail, /review\('reject'\)\} disabled=\{busy\}/, 'Reject button does not wait for a note');
});

test('rejection reasons are optional tick boxes saved as the note', async () => {
  const lib = await import('../lib/photos/library.ts');
  assert.equal(lib.rejectionNote([], ''), '');
  assert.equal(lib.rejectionNote(['Blurry, soft or low quality'], ''), 'Blurry, soft or low quality');
  assert.equal(lib.rejectionNote(['Text, logos or signs are garbled', 'Fake company name or branding'], ' sign says FORSALE '), 'Text, logos or signs are garbled; Fake company name or branding; sign says FORSALE');
  const detail = read('components/admin/photos/PhotoDetail.tsx');
  assert.match(detail, /data-testid="reject-reasons"/);
  assert.match(detail, /decision === 'reject' \? rejectionNote\(reasons, note\)/);
});
