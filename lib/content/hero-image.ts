/**
 * Featured ("hero") image display for blog articles (Stage 1B).
 *
 * Framework-free so the public page, the editor previews, the APIs and the tests
 * all use the same numbers.
 *
 * How it works (geometry only; there is NO face detection or image inspection):
 *   - Each screen size shows the photo in a frame with a fixed shape (FRAMES).
 *   - "cover" fills the frame and trims whatever doesn't fit. Which part is kept is
 *     set by the focus point (0-100 from left / from top), the same numbers the
 *     browser uses for CSS object-position, so the preview and the page match.
 *   - "contain" shows the whole photo, uncropped, on a soft blurred backdrop.
 *   - "auto" (default) uses cover unless the photo's shape is so different from
 *     the frame that a large part would be trimmed; then it shows the whole photo.
 *   - Without a chosen focus point the default keeps more of the TOP of the photo
 *     than the bottom (heads and faces are usually in the upper part), instead of
 *     a blind centre crop.
 */

export type HeroFit = 'auto' | 'cover' | 'contain';
export const HERO_FITS: readonly HeroFit[] = ['auto', 'cover', 'contain'];
export const HERO_FIT_LABELS: Record<HeroFit, string> = {
  auto: 'Automatic (recommended)',
  cover: 'Fill the banner (trim edges)',
  contain: 'Show the whole photo',
};

export type FrameName = 'mobile' | 'tablet' | 'desktop';
/** Frame shapes (width / height). Keep in step with the CSS classes in components/blog/HeroImage.tsx. */
export const FRAMES: Record<FrameName, { label: string; ratio: number; previewWidth: number }> = {
  mobile: { label: 'Phone', ratio: 16 / 9, previewWidth: 260 },
  tablet: { label: 'Tablet', ratio: 16 / 9, previewWidth: 360 },
  desktop: { label: 'Desktop', ratio: 2, previewWidth: 520 },
};
export const FRAME_NAMES: FrameName[] = ['desktop', 'tablet', 'mobile'];

/** Upper-weighted default: trims 70% of any excess height from the bottom, 30% from the top. */
export const DEFAULT_FOCUS = { x: 50, y: 30 } as const;
/** "auto" switches to the whole photo when cover would hide more than this share of either dimension. */
export const AUTO_CONTAIN_THRESHOLD = 0.2;
/** Warn when cover hides more than this share of the top (heads are often near the top). */
export const TOP_TRIM_WARNING = 0.03;
/** Warn when cover hides more than this share of the left, right or bottom edge. */
export const EDGE_TRIM_WARNING = 0.08;

export type HeroSettings = {
  featured_image_focus_x?: number | null;
  featured_image_focus_y?: number | null;
  featured_image_fit?: string | null;
  featured_image_width?: number | null;
  featured_image_height?: number | null;
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export function heroFocus(s: HeroSettings) {
  const x = typeof s.featured_image_focus_x === 'number' ? clamp(s.featured_image_focus_x) : DEFAULT_FOCUS.x;
  const y = typeof s.featured_image_focus_y === 'number' ? clamp(s.featured_image_focus_y) : DEFAULT_FOCUS.y;
  return { x, y, isDefault: typeof s.featured_image_focus_x !== 'number' && typeof s.featured_image_focus_y !== 'number' };
}

export function heroFit(s: HeroSettings): HeroFit {
  return (HERO_FITS as readonly string[]).includes(s.featured_image_fit || '') ? (s.featured_image_fit as HeroFit) : 'auto';
}

export function imageRatio(s: HeroSettings): number | null {
  const w = s.featured_image_width;
  const h = s.featured_image_height;
  return w && h && w > 0 && h > 0 ? w / h : null;
}

/** Share of the photo (0-1) hidden on each side when it fills a frame with "cover". */
export function coverTrim(imgRatio: number, frameRatio: number, focus: { x: number; y: number }) {
  const out = { top: 0, bottom: 0, left: 0, right: 0 };
  if (imgRatio > frameRatio) {
    const hidden = 1 - frameRatio / imgRatio; // photo is wider: trim left/right
    out.left = hidden * (focus.x / 100);
    out.right = hidden - out.left;
  } else if (imgRatio < frameRatio) {
    const hidden = 1 - imgRatio / frameRatio; // photo is taller: trim top/bottom
    out.top = hidden * (focus.y / 100);
    out.bottom = hidden - out.top;
  }
  return out;
}

/** What actually happens in one frame: "cover" (trimmed) or "contain" (whole photo). */
export function resolveFit(s: HeroSettings, frame: FrameName): 'cover' | 'contain' {
  const fit = heroFit(s);
  if (fit !== 'auto') return fit;
  const r = imageRatio(s);
  if (!r) return 'cover'; // size unknown until the photo loads; HeroImage re-checks on load
  const t = coverTrim(r, FRAMES[frame].ratio, { x: 50, y: 50 });
  return t.top + t.bottom > AUTO_CONTAIN_THRESHOLD || t.left + t.right > AUTO_CONTAIN_THRESHOLD ? 'contain' : 'cover';
}

/** CSS object-position for the focus point (same meaning as coverTrim). */
export function objectPosition(s: HeroSettings) {
  const f = heroFocus(s);
  return `${f.x}% ${f.y}%`;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Plain-English crop warnings, per frame. Based only on the photo's shape and the
 * focus point; it cannot see what is in the photo.
 */
export function cropWarnings(s: HeroSettings): string[] {
  const r = imageRatio(s);
  if (!r) return [];
  const focus = heroFocus(s);
  const warnings: string[] = [];
  for (const name of FRAME_NAMES) {
    if (resolveFit(s, name) === 'contain') continue;
    const t = coverTrim(r, FRAMES[name].ratio, focus);
    const label = FRAMES[name].label;
    if (t.top > TOP_TRIM_WARNING) {
      warnings.push(`${label}: the top ${pct(t.top)} of the photo is cut off. If people's heads are near the top, move the focus point up or choose "Show the whole photo".`);
    }
    for (const side of ['left', 'right', 'bottom'] as const) {
      if (t[side] > EDGE_TRIM_WARNING) {
        warnings.push(`${label}: ${pct(t[side])} of the photo's ${side} edge is cut off. Check that nobody important is near that edge.`);
      }
    }
  }
  return warnings;
}

/**
 * Validates hero display fields from an editor. Unknown keys are ignored; missing keys
 * are left out (so a partial update doesn't reset them). Empty string / null resets
 * a value to the default.
 */
export function cleanHeroInput(input: Record<string, unknown>) {
  const values: HeroSettings = {};
  const errors: string[] = [];
  const num = (key: 'featured_image_focus_x' | 'featured_image_focus_y', label: string) => {
    if (!(key in input)) return;
    const raw = input[key];
    if (raw === null || raw === '') { values[key] = null; return; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) errors.push(`${label} must be between 0 and 100`);
    else values[key] = Math.round(n);
  };
  num('featured_image_focus_x', 'Image focus (left-right)');
  num('featured_image_focus_y', 'Image focus (top-bottom)');
  if ('featured_image_fit' in input) {
    const v = input.featured_image_fit;
    if (v === null || v === '') values.featured_image_fit = 'auto';
    else if ((HERO_FITS as readonly unknown[]).includes(v)) values.featured_image_fit = v as HeroFit;
    else errors.push('Choose a valid image display option');
  }
  for (const key of ['featured_image_width', 'featured_image_height'] as const) {
    if (!(key in input)) continue;
    const raw = input[key];
    if (raw === null || raw === '') { values[key] = null; continue; }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 20000) errors.push('Image size must be a whole number of pixels');
    else values[key] = n;
  }
  return { values, errors };
}

export const HERO_COLUMNS =
  'featured_image_focus_x, featured_image_focus_y, featured_image_fit, featured_image_width, featured_image_height';
