/**
 * Photo library rules (Stage 2). Framework-free: shared by the admin API, the
 * admin screens and the unit tests.
 *
 * What is automated, honestly:
 *   - file type and pixel size are read from the file header (not trusted from the browser)
 *   - exact duplicates: identical SHA-256 of the file bytes
 *   - near duplicates: a 64-bit "difference hash" made from a 9×8 grey thumbnail of the
 *     photo (computed in the admin's browser). Similar hashes mean similar overall
 *     light/dark layout. It is a hint to check by eye, not a judgement of content.
 *   - resolution and crop-shape warnings from the pixel size
 * What is NOT automated: anything about what the photo shows (faces, hands, text,
 * realism, quality). Those are the reviewer's checklist and manual flags.
 */

export const PHOTO_USES = ['blog_featured', 'blog_inline', 'newsletter', 'social', 'website'] as const;
export type PhotoUse = (typeof PHOTO_USES)[number];
export const PHOTO_USE_LABELS: Record<PhotoUse, string> = {
  blog_featured: 'Blog featured (top) photo',
  blog_inline: 'Blog inline photo',
  newsletter: 'Newsletter (future)',
  social: 'Social media (future)',
  website: 'Website pages',
};

export const USAGE_RIGHTS = ['owned', 'licensed', 'free_stock', 'ai_generated', 'unknown'] as const;
export type UsageRights = (typeof USAGE_RIGHTS)[number];
export const USAGE_RIGHTS_LABELS: Record<UsageRights, string> = {
  owned: 'Owned (we took it / commissioned it)',
  licensed: 'Licensed (paid or permitted use)',
  free_stock: 'Free stock (licence allows commercial use)',
  ai_generated: 'AI-generated for ListWorx',
  unknown: 'Unknown — cannot be approved',
};

export const PHOTO_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PhotoStatus = (typeof PHOTO_STATUSES)[number];
export const PHOTO_STATUS_LABELS: Record<PhotoStatus, string> = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };

/** Problems a reviewer can mark by eye (nothing sets these automatically). */
export const MANUAL_FLAGS = ['unnatural_details', 'text_errors', 'low_quality', 'misleading', 'crop_risk'] as const;
export type ManualFlag = (typeof MANUAL_FLAGS)[number];
export const MANUAL_FLAG_LABELS: Record<ManualFlag, string> = {
  unnatural_details: 'Unnatural details (hands, faces, objects)',
  text_errors: 'Wrong or garbled text / signs',
  low_quality: 'Blurry, noisy or poorly lit',
  misleading: 'Could be mistaken for a real ListWorx client, job or document',
  crop_risk: 'Important subject close to the edge',
};

/** The three checks a person must confirm before an AI-generated photo can be approved (also enforced by the database). */
export const AI_CHECKLIST = [
  { key: 'hands_faces_natural', label: 'I looked closely: hands, fingers, faces and body positions look natural.' },
  { key: 'text_and_signs_correct', label: 'Any text, logos, cards or signs are correct or unreadable — nothing garbled or misleading.' },
  { key: 'not_presented_as_real', label: 'It will not be presented as a real ListWorx contractor, client, job or official document.' },
] as const;

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export const FEATURED_MIN_WIDTH = 1200;
export const INLINE_MIN_WIDTH = 800;
export const UNUSABLE_WIDTH = 400;
export const NEAR_DUPLICATE_DISTANCE = 6;

// ---------------------------------------------------------------- file header

export type ImageInfo = { mime: (typeof ALLOWED_PHOTO_TYPES)[number]; width: number; height: number };

/** Reads type and pixel size from the first bytes of a JPEG, PNG or WebP. Null if not one of those. */
export function readImageInfo(bytes: Uint8Array): ImageInfo | null {
  const b = bytes;
  const u16be = (i: number) => (b[i] << 8) | b[i + 1];
  const u32be = (i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
  const u16le = (i: number) => b[i] | (b[i + 1] << 8);
  const u24le = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { mime: 'image/png', width: u32be(16), height: u32be(20) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
        return { mime: 'image/jpeg', height: u16be(i + 5), width: u16be(i + 7) };
      }
      i += 2 + u16be(i + 2);
    }
    return null;
  }
  if (b.length >= 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const chunk = String.fromCharCode(...b.slice(12, 16));
    if (chunk === 'VP8X') return { mime: 'image/webp', width: u24le(24) + 1, height: u24le(27) + 1 };
    if (chunk === 'VP8 ') return { mime: 'image/webp', width: u16le(26) & 0x3fff, height: u16le(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { mime: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

// ---------------------------------------------------------------- duplicates

export function isDhash(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{16}$/.test(v);
}

/** Number of differing bits between two 64-bit difference hashes. */
export function hammingDistance(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < 16; i += 4) {
    let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

/**
 * Builds the 64-bit difference hash from a 9×8 grid of grey values (row by row).
 * Used by the browser after drawing the photo onto a 9×8 canvas.
 */
export function dhashFromGrid(grey: number[]): string {
  if (grey.length !== 72) throw new Error('need 9x8 grey values');
  let hex = '';
  let nibble = 0;
  let bits = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      nibble = (nibble << 1) | (grey[y * 9 + x] > grey[y * 9 + x + 1] ? 1 : 0);
      if (++bits === 4) { hex += nibble.toString(16); nibble = 0; bits = 0; }
    }
  }
  return hex;
}

export type DuplicateInfo = { exact: string[]; similar: { id: string; distance: number }[] };

/** For each asset: other assets with the same bytes, and visually similar ones (by fingerprint). */
export function findDuplicates(assets: { id: string; sha256: string; dhash: string | null; archived?: boolean }[]) {
  const live = assets.filter((a) => !a.archived);
  const out: Record<string, DuplicateInfo> = {};
  for (const a of live) {
    const exact = live.filter((o) => o.id !== a.id && o.sha256 === a.sha256).map((o) => o.id);
    const similar = a.dhash
      ? live
          .filter((o) => o.id !== a.id && o.sha256 !== a.sha256 && o.dhash)
          .map((o) => ({ id: o.id, distance: hammingDistance(a.dhash!, o.dhash!) }))
          .filter((o) => o.distance <= NEAR_DUPLICATE_DISTANCE)
          .sort((x, y) => x.distance - y.distance)
      : [];
    out[a.id] = { exact, similar };
  }
  return out;
}

// ---------------------------------------------------------------- warnings

export type PhotoLike = {
  width: number;
  height: number;
  is_ai_generated: boolean;
  usage_rights: string;
  alt_text: string | null;
  intended_uses: string[];
  quality_flags: string[];
};

export type Warning = { level: 'block' | 'warn' | 'info'; code: string; text: string };

/** Plain-English warnings from facts we actually know about the file and its metadata. */
export function photoWarnings(p: PhotoLike, dup?: DuplicateInfo): Warning[] {
  const w: Warning[] = [];
  if (p.width < UNUSABLE_WIDTH) {
    w.push({ level: 'block', code: 'very_low_res', text: `Very low resolution (${p.width}×${p.height}). Too small to publish anywhere — enlarging does not add detail.` });
  } else if (p.width < INLINE_MIN_WIDTH) {
    w.push({ level: 'warn', code: 'low_res', text: `Low resolution (${p.width}px wide). Only suitable for small images; not for a blog photo.` });
  } else if (p.width < FEATURED_MIN_WIDTH) {
    w.push({ level: p.intended_uses.includes('blog_featured') ? 'warn' : 'info', code: 'not_featured_size', text: `${p.width}px wide: fine inline, but featured photos should be at least ${FEATURED_MIN_WIDTH}px wide.` });
  }
  const ratio = p.width / p.height;
  if (ratio < 1.2) w.push({ level: 'info', code: 'tall_shape', text: 'Square or tall photo: as a featured photo it will be shown whole (not cropped) unless you choose otherwise.' });
  if (dup?.exact.length) w.push({ level: 'warn', code: 'exact_duplicate', text: `Identical file already in the library (${dup.exact.length}).` });
  if (dup?.similar.length) w.push({ level: 'warn', code: 'near_duplicate', text: `Looks very similar to ${dup.similar.length} other photo(s) by image fingerprint. Compare them by eye.` });
  if (p.is_ai_generated) w.push({ level: 'warn', code: 'ai', text: 'AI-generated: check hands, faces, text and signs closely, and never present it as a real client, job or document. Needs your approval.' });
  if (p.usage_rights === 'unknown') w.push({ level: 'block', code: 'rights_unknown', text: 'Usage rights unknown. Record them before approval.' });
  if (!p.alt_text || !p.alt_text.trim()) w.push({ level: 'block', code: 'no_alt', text: 'No alt text yet. Describe what the photo shows before approval.' });
  for (const f of p.quality_flags) {
    if ((MANUAL_FLAGS as readonly string[]).includes(f)) w.push({ level: 'warn', code: `flag_${f}`, text: `Marked by a reviewer: ${MANUAL_FLAG_LABELS[f as ManualFlag]}.` });
  }
  return w;
}

/** Can this photo be approved right now (mirrors the database rule, for button states)? */
export function approvalProblems(p: PhotoLike, checklist: Record<string, boolean>): string[] {
  const out: string[] = [];
  if (!p.alt_text || !p.alt_text.trim()) out.push('Add alt text');
  if (p.usage_rights === 'unknown') out.push('Record the usage rights');
  if (p.is_ai_generated) for (const c of AI_CHECKLIST) if (!checklist[c.key]) out.push('Complete the AI review checklist');
  return Array.from(new Set(out));
}

// ---------------------------------------------------------------- metadata input

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function cleanTags(v: unknown): string[] {
  const list = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  return Array.from(new Set(list.map((t) => clean(t, 40).toLowerCase()).filter(Boolean))).slice(0, 30);
}

/** Validates metadata edits. Approval fields and file fields are never accepted here. */
export function cleanPhotoInput(input: Record<string, unknown>) {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  const text = (k: string, max: number) => { if (k in input) values[k] = clean(input[k], max) || null; };
  text('title', 160); text('description', 1000); text('category', 60); text('source', 200); text('rights_notes', 500);
  if ('alt_text' in input) {
    const v = clean(input.alt_text, 400);
    if (v.length > 300) errors.push('Alt text must be 300 characters or fewer');
    values.alt_text = v || null;
  }
  if ('tags' in input) values.tags = cleanTags(input.tags);
  if ('intended_uses' in input) {
    const v = Array.isArray(input.intended_uses) ? input.intended_uses : [];
    if (v.some((u) => !(PHOTO_USES as readonly unknown[]).includes(u))) errors.push('Unknown intended use');
    else values.intended_uses = Array.from(new Set(v as string[]));
  }
  if ('quality_flags' in input) {
    const v = Array.isArray(input.quality_flags) ? input.quality_flags : [];
    if (v.some((u) => !(MANUAL_FLAGS as readonly unknown[]).includes(u))) errors.push('Unknown quality flag');
    else values.quality_flags = Array.from(new Set(v as string[]));
  }
  if ('usage_rights' in input) {
    if (!(USAGE_RIGHTS as readonly unknown[]).includes(input.usage_rights)) errors.push('Choose valid usage rights');
    else values.usage_rights = input.usage_rights;
  }
  if ('is_ai_generated' in input) {
    if (typeof input.is_ai_generated !== 'boolean') errors.push('AI-generated must be yes or no');
    else values.is_ai_generated = input.is_ai_generated;
  }
  for (const k of ['focus_x', 'focus_y'] as const) {
    if (!(k in input)) continue;
    const raw = input[k];
    if (raw === null || raw === '') { values[k] = null; continue; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) errors.push('Focus point must be between 0 and 100');
    else values[k] = Math.round(n);
  }
  if ('archived' in input) {
    if (typeof input.archived !== 'boolean') errors.push('Archived must be yes or no');
    else values.archived = input.archived;
  }
  return { values, errors };
}

/** Safe storage name: library/YYYY/MM/<uuid>-<cleaned original name>. */
export function libraryPath(originalName: string, uuid: string, now = new Date()) {
  const ext = (originalName.match(/\.(jpe?g|png|webp)$/i)?.[1] || 'jpg').toLowerCase();
  const base = originalName.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'photo';
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `library/${now.getUTCFullYear()}/${mm}/${uuid}-${base}.${ext === 'jpeg' ? 'jpg' : ext}`;
}

// ---------------------------------------------------------------- search

export type SearchableAsset = {
  original_filename: string; title: string | null; description: string | null; category: string | null;
  tags: string[]; intended_uses: string[]; status: string; is_ai_generated: boolean; alt_text: string | null; archived: boolean;
};

export function matchesSearch(a: SearchableAsset, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [a.original_filename, a.title, a.description, a.category, a.alt_text, ...a.tags].filter(Boolean).join(' ').toLowerCase();
  return words.every((w) => hay.includes(w));
}

// ---------------------------------------------------------------- import list (IMAGE_MANIFEST.csv)

/** Minimal CSV reader (quoted fields, commas, newlines in quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== '')) rows.push(row);
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

/** Metadata suggested for a file from an IMAGE_MANIFEST.csv row (matched by file name). */
export function manifestSuggestions(rows: Record<string, string>[], fileName: string) {
  const row = rows.find((r) => (r.filename || '').split('/').pop() === fileName);
  if (!row) return null;
  const uses: PhotoUse[] = row.role === 'featured_reference' ? ['blog_featured'] : row.role === 'inline_reference' ? ['blog_inline'] : [];
  return {
    title: row.title || null,
    category: row.audience || null,
    tags: cleanTags([row.article_id, row.role, row.audience].filter(Boolean)),
    intended_uses: uses,
    external_ref: row.article_id || null,
    import_note: row.publish_ready || null,
  };
}

// ---------------------------------------------------------------- articles

/** Image addresses used by an article: the featured photo plus every <img src> in the body. */
export function articleImageUrls(featured: string | null | undefined, body: string | null | undefined) {
  const urls = new Set<string>();
  if (featured) urls.add(featured.trim());
  for (const m of (body || '').matchAll(/<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)/gi)) urls.add(m[1].trim());
  return Array.from(urls).filter(Boolean);
}
