// Stage 1B: featured ("hero") photo display. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FRAMES, DEFAULT_FOCUS, coverTrim, resolveFit, objectPosition, cropWarnings, cleanHeroInput, heroFocus, heroFit,
} from '../lib/content/hero-image.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
// The live article's hero photo (Kitchen-Renovation-Consultation.png).
const LIVE = { featured_image_width: 1731, featured_image_height: 909 };

test('the old layout cut the top of the live photo; the new one keeps it', () => {
  // Old: full-width banner capped at 480px tall on a 1440px screen, centre crop.
  const old = coverTrim(1731 / 909, 1440 / 480, { x: 50, y: 50 });
  assert.ok(old.top > 0.15, `old layout hid ${old.top} of the top`);
  // New: framed 2:1 on desktop, upper-weighted default focus.
  for (const name of ['desktop', 'tablet', 'mobile']) {
    const t = coverTrim(1731 / 909, FRAMES[name].ratio, DEFAULT_FOCUS);
    assert.ok(t.top <= 0.03, `${name}: top trim ${t.top}`);
    assert.ok(t.left + t.right + t.top + t.bottom <= 0.07, `${name}: total trim small`);
  }
  assert.deepEqual(cropWarnings(LIVE), [], 'no warnings for the live photo at the default');
  assert.equal(resolveFit(LIVE, 'desktop'), 'cover');
});

test('default focus is upper-weighted, not a blind centre crop', () => {
  assert.equal(objectPosition({}), '50% 30%');
  assert.ok(DEFAULT_FOCUS.y < 50);
  const t = coverTrim(1, 2, DEFAULT_FOCUS); // square photo in a 2:1 frame
  assert.ok(t.top < t.bottom, 'more is trimmed from the bottom than the top');
  assert.equal(heroFocus({}).isDefault, true);
});

test('focus point override moves the crop exactly like CSS object-position', () => {
  const s = { ...LIVE, featured_image_focus_x: 20, featured_image_focus_y: 0 };
  assert.equal(objectPosition(s), '20% 0%');
  const t = coverTrim(1, 2, { x: 50, y: 0 });
  assert.equal(t.top, 0);
  assert.equal(t.bottom, 0.5);
  const w = coverTrim(3, 2, { x: 0, y: 50 });
  assert.equal(w.left, 0);
  assert.ok(Math.abs(w.right - 1 / 3) < 1e-9);
});

test('photos that cannot fit a banner are shown whole instead of badly cropped', () => {
  const portrait = { featured_image_width: 900, featured_image_height: 1200 };
  for (const f of ['desktop', 'tablet', 'mobile']) assert.equal(resolveFit(portrait, f), 'contain');
  const square = { featured_image_width: 1000, featured_image_height: 1000 };
  assert.equal(resolveFit(square, 'desktop'), 'contain');
  const panorama = { featured_image_width: 4000, featured_image_height: 1000 };
  assert.equal(resolveFit(panorama, 'mobile'), 'contain');
  // Manual choice wins.
  assert.equal(resolveFit({ ...portrait, featured_image_fit: 'cover' }, 'desktop'), 'cover');
  assert.equal(resolveFit({ ...LIVE, featured_image_fit: 'contain' }, 'desktop'), 'contain');
  // Unknown size: fills the banner until the browser measures the photo.
  assert.equal(resolveFit({}, 'desktop'), 'cover');
});

test('crop warnings name the screen size and the edge', () => {
  const forced = { featured_image_width: 1000, featured_image_height: 1000, featured_image_fit: 'cover', featured_image_focus_y: 60 };
  const w = cropWarnings(forced);
  assert.ok(w.some((m) => /^Desktop: the top \d+% of the photo is cut off/.test(m)), w.join('\n'));
  assert.ok(w.some((m) => /bottom edge is cut off/.test(m)));
  const wide = { featured_image_width: 3000, featured_image_height: 1000, featured_image_fit: 'cover', featured_image_focus_x: 0 };
  assert.ok(cropWarnings(wide).some((m) => /^Phone: \d+% of the photo's right edge/.test(m)));
  assert.deepEqual(cropWarnings({}), [], 'no warnings (and no claims) without a measured photo');
});

test('editor input validation', () => {
  assert.deepEqual(cleanHeroInput({ featured_image_focus_x: '40', featured_image_focus_y: 12.4, featured_image_fit: 'contain', featured_image_width: 1731, featured_image_height: 909 }).values,
    { featured_image_focus_x: 40, featured_image_focus_y: 12, featured_image_fit: 'contain', featured_image_width: 1731, featured_image_height: 909 });
  assert.deepEqual(cleanHeroInput({ featured_image_focus_x: null, featured_image_fit: '' }).values, { featured_image_focus_x: null, featured_image_fit: 'auto' });
  assert.deepEqual(cleanHeroInput({ title: 'x' }).values, {}, 'missing keys are left alone');
  assert.ok(cleanHeroInput({ featured_image_focus_x: 101 }).errors.length);
  assert.ok(cleanHeroInput({ featured_image_focus_y: 'top' }).errors.length);
  assert.ok(cleanHeroInput({ featured_image_fit: 'stretch' }).errors.length);
  assert.ok(cleanHeroInput({ featured_image_width: 0 }).errors.length);
  assert.equal(heroFit({ featured_image_fit: 'nonsense' }), 'auto');
});

test('public page, previews and frames stay in step', () => {
  const page = read('app/blog/[slug]/page.tsx');
  assert.match(page, /<HeroImage[\s\S]*settings=\{post\}/);
  assert.doesNotMatch(page, /max-h-\[480px\]/, 'old full-width 480px centre crop removed');
  const hero = read('components/blog/HeroImage.tsx');
  assert.match(hero, /aspect-\[16\/9\] lg:aspect-\[2\/1\]/);
  assert.equal(FRAMES.mobile.ratio, 16 / 9);
  assert.equal(FRAMES.tablet.ratio, 16 / 9);
  assert.equal(FRAMES.desktop.ratio, 2);
  assert.doesNotMatch(hero, /object-fill|object-scale-down/, 'never stretches the public photo');
  for (const f of ['components/admin/content/ContentManager.tsx', 'app/admin/crm/blog/page.tsx']) {
    assert.match(read(f), /HeroImageControls/, `${f} has the position controls`);
  }
  const controls = read('components/admin/content/HeroImageControls.tsx');
  assert.match(controls, /<HeroImage[^>]*frame=\{name\}/, 'previews use the public component');
  assert.match(controls, /Nothing checks what is in the photo/, 'no claim of image inspection');
});

test('public blog keeps working if the code ships before the database columns', () => {
  const blog = read('lib/blog.ts');
  assert.match(blog, /withHeroFallback/);
  assert.match(blog, /return run\(BASE_COLUMNS\)/);
});
