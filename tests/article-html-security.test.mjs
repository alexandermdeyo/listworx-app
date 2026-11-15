// Stage 1B follow-up: article HTML allowlist. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeArticleHtml as clean, findUnsafeArticleHtml, unsafeArticleHtmlMessage } from '../lib/content/sanitize-html.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** Nothing executable may survive: no script/style/frame tags, no on* handlers, no script URLs. */
function assertInert(out, label) {
  assert.doesNotMatch(out, /<\s*(script|style|iframe|object|embed|svg|math|form|input|button|base|meta|link|template|frame)/i, `${label}: dangerous tag survived -> ${out}`);
  assert.doesNotMatch(out, /<[^>]*\son[a-z]+\s*=/i, `${label}: event handler survived -> ${out}`);
  assert.doesNotMatch(out, /(href|src)\s*=\s*"\s*(javascript|vbscript|data|file):/i, `${label}: unsafe URL survived -> ${out}`);
  assert.doesNotMatch(out, /style="[^"]*(url\(|expression|javascript|@import)/i, `${label}: unsafe style survived -> ${out}`);
}

const ATTACKS = {
  script: '<script>alert(1)</script>',
  scriptUpper: '<SCRIPT SRC=//evil.example/x.js></SCRIPT>',
  scriptSplit: '<scr<script>ipt>alert(1)</script>',
  imgOnerror: '<img src=x onerror=alert(1)>',
  imgOnerrorValidSrc: '<img src="https://ok.example/a.png" onerror="alert(1)">',
  svgOnload: '<svg onload=alert(1)><circle /></svg>',
  jsLink: '<a href="javascript:alert(1)">click</a>',
  jsLinkEntity: '<a href="jav&#x09;ascript:alert(1)">click</a>',
  jsLinkEncoded: '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">x</a>',
  jsLinkSpaces: '<a href="  JaVaScRiPt:alert(1)">x</a>',
  vbs: '<a href="vbscript:msgbox(1)">x</a>',
  dataHtml: '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  dataImg: '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
  iframe: '<iframe src="https://evil.example"></iframe>',
  objectEmbed: '<object data="x.swf"></object><embed src="x.swf">',
  styleTag: '<style>body{display:none}</style>',
  styleUrl: '<img src="https://ok.example/a.png" style="background:url(javascript:alert(1));width:100%">',
  styleExpression: '<img src="https://ok.example/a.png" style="width:expression(alert(1))">',
  form: '<form action="https://evil.example"><input name=p><button>Go</button></form>',
  meta: '<meta http-equiv="refresh" content="0;url=https://evil.example">',
  base: '<base href="https://evil.example/">',
  mathml: '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
  comment: '<!--<img src=x onerror=alert(1)>-->',
  attrBreakout: '<a href="https://ok.example/" title=\'"><script>alert(1)</script>\'>x</a>',
  unclosed: '<img src="https://ok.example/a.png" onerror="alert(1)"',
  divHandler: '<div onclick="alert(1)">text</div>',
  protocolRelativeImg: '<img src="//evil.example/track.png">',
  srcdoc: '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
};

test('every known attack is neutralised', () => {
  for (const [name, html] of Object.entries(ATTACKS)) assertInert(clean(html), name);
});

test('every attack (except plain wrappers) is reported so the editors refuse to save it', () => {
  for (const [name, html] of Object.entries(ATTACKS)) {
    // Comments and an unfinished final tag are dropped entirely by the parser: nothing is output, so nothing can run.
    if (name === 'comment' || name === 'unclosed') { assert.equal(clean(html), ''); continue; }
    assert.ok(findUnsafeArticleHtml(html).length > 0, `${name} not reported`);
    assert.match(unsafeArticleHtmlMessage(html), /not allowed/);
  }
});

test('attacks inside the markdown the renderer produces are still neutralised', () => {
  // renderBody turns **x** into <strong>x</strong> BEFORE sanitising.
  const md = '**Bold** <img src=x onerror=alert(1)> *em* <a href="javascript:alert(1)">x</a>';
  const html = md.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  const out = clean(html);
  assertInert(out, 'markdown');
  assert.match(out, /<strong>Bold<\/strong>/);
  assert.match(out, /<em>em<\/em>/);
});

test('legitimate formatting, links and images are preserved', () => {
  const editorImg = '<img src="https://cwggjrxzyfhdsnvcgkzc.supabase.co/storage/v1/object/public/site-images/blog/a.jpg" alt="Kitchen remodel" style="width:100%;border-radius:10px;margin:8px 0" />';
  assert.equal(clean(editorImg), editorImg, 'Blog editor "Add photo to post" line is unchanged');

  const cases = [
    'Plain sentence with no markup.',
    'Ask about <strong>licensing</strong> and <em>insurance</em>.',
    'Read <a href="https://www.tn.gov/commerce.html">the state guide</a> first.',
    'See <a href="/blog/hiring-checklist">our checklist</a> or <a href="#faq">the FAQ</a>.',
    'Email <a href="mailto:adeyo@listworx.co">adeyo@listworx.co</a> or call <a href="tel:+16153624996">us</a>.',
    'Line one<br />line two',
    'Use <code>R-30</code> insulation, <u>not</u> <s>R-13</s>; H<sub>2</sub>O and m<sup>2</sup>.',
    '<img src="/images/logo.png" alt="ListWorx" />',
  ];
  for (const c of cases) assert.equal(clean(c), c, c);

  assert.equal(
    clean('<a href="https://example.com" target="_blank">x</a>'),
    '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>',
    'new-tab links get rel=noopener',
  );
  assert.equal(findUnsafeArticleHtml(cases.join('\n') + editorImg).length, 0, 'legitimate content is never reported');
});

test('stray characters are shown, not interpreted', () => {
  assert.equal(clean('Budget < $5,000 & timeline > 2 weeks'), 'Budget &lt; $5,000 &amp; timeline &gt; 2 weeks');
  assert.equal(clean('Tom &amp; Jerry'), 'Tom &amp; Jerry', 'existing entities are not double-escaped');
  assert.equal(clean('<b>unclosed bold'), '<b>unclosed bold</b>', 'unclosed tags are closed');
  assert.equal(clean('</strong>stray close'), 'stray close');
  assert.equal(clean('<div class="x">text</div>'), 'text', 'unknown layout tags are removed, text kept');
});

test('the public blog page and the Content preview both render through the allowlist', () => {
  const src = read('lib/blog-render.tsx');
  assert.match(src, /dangerouslySetInnerHTML=\{\{ __html: sanitizeArticleHtml\(withInline\) \}\}/);
  assert.equal((src.match(/dangerouslySetInnerHTML/g) || []).length, 1, 'no other raw HTML path in the renderer');
  assert.match(read('app/blog/[slug]/page.tsx'), /import \{ renderBody \} from '@\/lib\/blog-render';/);
  assert.match(read('components/admin/content/ContentManager.tsx'), /import \{ renderBody \} from '@\/lib\/blog-render';/);
});

test('renderer is the original except for the sanitising call', () => {
  const before = read('tests/fixtures-blog-page-before.txt');
  const oldFn = before.slice(before.indexOf('function renderBody(text: string) {'), before.indexOf('export default async function BlogPostPage')).trim();
  const shared = read('lib/blog-render.tsx');
  const newFn = shared.slice(shared.indexOf('function renderBody(text: string) {')).trim();
  assert.equal(newFn.replace('__html: sanitizeArticleHtml(withInline)', '__html: withInline'), oldFn);
});

test('both editors refuse to save unsafe HTML and record the acting admin', () => {
  const blog = read('app/api/blog/route.ts');
  const content = read('app/api/admin/content/route.ts');
  for (const [name, src] of [['blog POST', blog.split('export async function POST')[1].split('export async function')[0]],
    ['blog PATCH', blog.split('export async function PATCH')[1].split('export async function')[0]],
    ['content POST', content.split('export async function POST')[1].split('export async function')[0]],
    ['content PATCH', content.split('export async function PATCH')[1].split('export async function')[0]]]) {
    assert.match(src, /unsafeArticleHtmlMessage\(/, `${name} checks HTML`);
  }
  assert.match(blog.split('export async function POST')[1], /^\([^)]*\)\s*\{\s*const adminId = await requireAdminRequest\(request\);\s*if \(!adminId\) return unauthorized\(\);\s*const supabaseAdmin = createSupabaseActorClient\(adminId\)/);
  assert.match(content, /createSupabaseActorClient\(adminId\)/);
});

// The one article published on listworx.co today (public text, copied 2026-11-14).
test('the live published article keeps every link, style and image', async () => {
  const { Parser } = await import('htmlparser2');
  const shape = (html) => {
    const out = [];
    const p = new Parser({
      onopentag(name, attrs) {
        const a = { ...attrs };
        delete a.rel; // new-tab links are normalised to rel="noopener noreferrer"
        if (a.style) a.style = a.style.split(';').map((d) => d.trim().replace(/\s*:\s*/, ':')).filter(Boolean).join(';');
        out.push(['open', name, Object.entries(a).sort()]);
      },
      ontext(t) { out.push(['text', t]); },
      onclosetag(name) { out.push(['close', name]); },
    }, { decodeEntities: true });
    p.write(html); p.end();
    return JSON.stringify(out);
  };
  const body = read('tests/fixtures-published-article.txt');
  let inline = 0;
  for (const para of body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)) {
    if (/^(#{1,3} |- |\* |\d+\. |> )/.test(para)) continue; // headings/lists are rendered as plain text, unchanged
    const withInline = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    assert.equal(shape(clean(withInline)), shape(withInline), para.slice(0, 60));
    if (/<(a|img)\b/.test(para)) inline++;
  }
  assert.equal(inline, 3, 'covers the state-license link, the button link and the image');
  assert.equal(findUnsafeArticleHtml(body).length, 0, 'the live article can still be saved');
  assert.match(clean('<a href="/request" style="display:inline-block;background:#E8621A;color:#fff">Go</a>'), /style="display:inline-block;background:#E8621A;color:#fff"/);
  assert.doesNotMatch(clean('<a href="/x" style="background:url(https://evil.example/t.gif)">x</a>'), /url/);
});
