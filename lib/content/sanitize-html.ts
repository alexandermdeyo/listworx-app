/**
 * Article HTML allowlist (Stage 1B security fix).
 *
 * Article bodies are mostly plain text with light formatting, but paragraphs are
 * rendered as HTML so admins can use inline tags such as the Blog editor's
 * "Add photo to post" <img> line, links and bold/italic. Everything that reaches
 * the page goes through sanitizeArticleHtml(), which keeps ONLY:
 *   - a small set of inline tags (links, images, bold/italic/underline, code, line breaks ...)
 *   - a small set of attributes per tag
 *   - http(s)/mailto/tel or same-site link addresses; http(s) or same-site image addresses
 *   - a few harmless style properties on images and links (size, spacing, colour, rounded corners ...)
 * Scripts, styles, frames, forms, event handlers (onclick, onerror ...) and
 * javascript:/data: addresses are removed. Text is re-escaped, so stray "<" or "&"
 * in an article are shown as characters, never interpreted as markup.
 *
 * findUnsafeArticleHtml() reports what would be removed for the dangerous cases so
 * the editors can refuse to save it with a clear message (the renderer stays the
 * real safety net, including for articles saved before this fix).
 */
import { Parser } from 'htmlparser2';

const ALLOWED_TAGS = new Set(['a', 'img', 'strong', 'b', 'em', 'i', 'u', 's', 'br', 'code', 'span', 'small', 'sup', 'sub', 'mark']);
const VOID_TAGS = new Set(['img', 'br']);
/** Removed together with everything inside them. */
const DROP_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'noscript', 'template',
  'textarea', 'select', 'option', 'svg', 'math', 'title', 'xmp', 'noembed', 'noframes', 'head', 'plaintext',
]);
/** Removed (contents kept as text) but reported as dangerous when found. */
const DANGEROUS_TAGS = new Set(['form', 'input', 'button', 'base', 'meta', 'link', 'video', 'audio', 'source', 'track', 'picture', 'portal']);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel', 'style']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'style', 'loading']),
};
const GLOBAL_ATTRS = new Set(['title']);

const SPACING = ['margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right'];
/** Inline style properties kept per tag (values may not contain "(" so url()/expression() can't appear). */
const STYLE_PROPS: Record<string, Set<string>> = {
  img: new Set(['width', 'max-width', 'height', 'max-height', 'border-radius', 'display', ...SPACING]),
  // Styled links, e.g. the rust "Get matched" button in published articles.
  a: new Set(['color', 'background', 'background-color', 'font-weight', 'font-style', 'text-decoration',
    'display', 'border-radius', ...SPACING]),
};
const SAFE_STYLE_VALUE = /^[0-9a-z.%\s#-]+$/i;

export type UnsafeFinding = { kind: 'tag' | 'event_handler' | 'url' | 'attribute'; detail: string };

function escapeText(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string) {
  return escapeText(s).replace(/"/g, '&quot;');
}

// Control characters, spaces, zero-width and line/paragraph separators (escaped, not literal).
const INVISIBLE_URL_CHARS = new RegExp('[\\u0000-\\u0020\\u007f-\\u009f\\u200b-\\u200f\\u2028\\u2029\\ufeff]', 'g');

/** Removes characters browsers ignore inside URL schemes ("java\tscript:"). */
function normalizeUrl(raw: string) {
  return raw.replace(INVISIBLE_URL_CHARS, '');
}

/** Same-site path ("/blog/x", "#top", "?q=1") or no scheme at all ("page.html"). */
function isRelative(url: string) {
  if (url.startsWith('//')) return false;
  if (/^[\/#?]/.test(url)) return true;
  const colon = url.indexOf(':');
  if (colon === -1) return true;
  const firstSep = url.search(/[\/?#]/);
  return firstSep !== -1 && firstSep < colon;
}

export function isSafeLinkUrl(raw: string) {
  const url = normalizeUrl(raw);
  if (!url) return false;
  return /^(https?:|mailto:|tel:)/i.test(url) || isRelative(url);
}

export function isSafeImageUrl(raw: string) {
  const url = normalizeUrl(raw);
  return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
}

function cleanStyle(tag: string, raw: string): { value: string; rejected: string[] } {
  const allowedProps = STYLE_PROPS[tag] || new Set<string>();
  const kept: string[] = [];
  const rejected: string[] = [];
  for (const decl of raw.split(';')) {
    if (!decl.trim()) continue;
    const idx = decl.indexOf(':');
    const prop = idx === -1 ? decl.trim().toLowerCase() : decl.slice(0, idx).trim().toLowerCase();
    const val = idx === -1 ? '' : decl.slice(idx + 1).trim();
    if (allowedProps.has(prop) && val && SAFE_STYLE_VALUE.test(val)) kept.push(`${prop}:${val}`);
    else rejected.push(prop);
  }
  return { value: kept.join(';'), rejected };
}

function run(html: string, findings: UnsafeFinding[] | null): string {
  let out = '';
  const open: string[] = [];
  let dropDepth = 0;
  let dropTag = '';

  const parser = new Parser(
    {
      onopentag(rawName, attribs) {
        const name = rawName.toLowerCase();
        if (dropDepth > 0) {
          if (name === dropTag) dropDepth++;
          return;
        }
        if (DROP_WITH_CONTENT.has(name)) {
          findings?.push({ kind: 'tag', detail: `<${name}>` });
          if (!VOID_TAGS.has(name)) {
            dropDepth = 1;
            dropTag = name;
          }
          return;
        }
        for (const [attr, value] of Object.entries(attribs)) {
          if (/^on/i.test(attr)) findings?.push({ kind: 'event_handler', detail: attr.toLowerCase() });
          else if (/<\s*\/?\s*[a-z]/i.test(value)) findings?.push({ kind: 'attribute', detail: `code hidden in "${attr.toLowerCase()}"` });
        }
        if (!ALLOWED_TAGS.has(name)) {
          if (DANGEROUS_TAGS.has(name) || !/^[a-z][a-z0-9-]*$/.test(name)) {
            findings?.push({ kind: 'tag', detail: `<${name.replace(/[^a-z0-9-]/g, '')}>` }); // malformed names like "scr<script"
          }
          return;
        }

        const allowed = ALLOWED_ATTRS[name] || GLOBAL_ATTRS;
        const parts: string[] = [];
        let target: string | null = null;
        for (const [rawAttr, value] of Object.entries(attribs)) {
          const attr = rawAttr.toLowerCase();
          if (!allowed.has(attr)) continue;
          if (attr === 'href') {
            if (!isSafeLinkUrl(value)) { findings?.push({ kind: 'url', detail: `link to "${value.slice(0, 60)}"` }); continue; }
            parts.push(`href="${escapeAttr(value.trim())}"`);
          } else if (attr === 'src') {
            if (!isSafeImageUrl(value)) { findings?.push({ kind: 'url', detail: `image from "${value.slice(0, 60)}"` }); continue; }
            parts.push(`src="${escapeAttr(value.trim())}"`);
          } else if (attr === 'style') {
            const { value: style } = cleanStyle(name, value);
            if (/url\s*\(|expression|javascript:|@import|behavior\s*:/i.test(value)) {
              findings?.push({ kind: 'attribute', detail: 'unsafe style' });
            }
            if (style) parts.push(`style="${escapeAttr(style)}"`);
          } else if (attr === 'target') {
            if (value === '_blank' || value === '_self') target = value;
          } else if (attr === 'rel') {
            // Rebuilt below for new-tab links; other values are harmless hints.
            if (/^[a-z\s-]+$/i.test(value)) parts.push(`rel="${escapeAttr(value)}"`);
          } else if (attr === 'width' || attr === 'height') {
            if (/^\d{1,4}%?$/.test(value)) parts.push(`${attr}="${value}"`);
          } else if (attr === 'loading') {
            if (value === 'lazy' || value === 'eager') parts.push(`loading="${value}"`);
          } else {
            parts.push(`${attr}="${escapeAttr(value)}"`);
          }
        }
        if (name === 'img' && !parts.some((p) => p.startsWith('src='))) return; // nothing safe to show
        if (target) {
          parts.push(`target="${target}"`);
          if (target === '_blank') {
            const i = parts.findIndex((p) => p.startsWith('rel='));
            if (i !== -1) parts.splice(i, 1);
            parts.push('rel="noopener noreferrer"');
          }
        }
        out += `<${name}${parts.length ? ' ' + parts.join(' ') : ''}${VOID_TAGS.has(name) ? ' />' : '>'}`;
        if (!VOID_TAGS.has(name)) open.push(name);
      },
      ontext(text) {
        if (dropDepth > 0) return;
        out += escapeText(text);
      },
      onclosetag(rawName, isImplied) {
        const name = rawName.toLowerCase();
        if (dropDepth > 0) {
          if (name === dropTag) dropDepth--;
          return;
        }
        if (isImplied && VOID_TAGS.has(name)) return;
        const i = open.lastIndexOf(name);
        if (i === -1) return;
        while (open.length > i) out += `</${open.pop()}>`;
      },
      oncomment() {
        /* dropped */
      },
      onprocessinginstruction() {
        /* dropped (doctype etc.) */
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true, recognizeSelfClosing: true },
  );
  parser.write(html);
  parser.end();
  while (open.length) out += `</${open.pop()}>`;
  return out;
}

/** The only function that should turn article text into HTML for the browser. */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return '';
  return run(html, null);
}

/** Dangerous constructs that sanitizeArticleHtml() would remove (for save-time messages). */
export function findUnsafeArticleHtml(html: string | null | undefined): UnsafeFinding[] {
  if (!html || !/[<&]/.test(html)) return [];
  const findings: UnsafeFinding[] = [];
  run(html, findings);
  const seen = new Set<string>();
  return findings.filter((f) => (seen.has(f.kind + f.detail) ? false : (seen.add(f.kind + f.detail), true)));
}

/** One plain-English sentence for the editors, or null when the text is fine. */
export function unsafeArticleHtmlMessage(html: string | null | undefined): string | null {
  const found = findUnsafeArticleHtml(html);
  if (!found.length) return null;
  const list = found.slice(0, 5).map((f) => (f.kind === 'event_handler' ? `"${f.detail}" attribute` : f.detail)).join(', ');
  return `The article contains code that is not allowed and was not saved (${list}). Remove it and save again. Links, images, bold and italic are fine.`;
}
