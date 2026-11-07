/**
 * "The ListWorx Standard" newsletter: email template + Resend batch sending.
 * Server-only (uses RESEND_API_KEY).
 */

export const NEWSLETTER_NAME = process.env.NEXT_PUBLIC_NEWSLETTER_NAME || 'The ListWorx Standard';

const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';
const BUSINESS_ADDRESS = 'ListWorx LLC · 2147 Springdale Lane, Suite F104 · Gallatin, TN 37066';
const RUST = '#E8621A';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

export function unsubscribeUrl(token: string | null | undefined) {
  return token ? `${BASE_URL}/api/newsletter/unsubscribe?token=${token}` : `${BASE_URL}/contact`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

/**
 * Wraps campaign body HTML in the branded shell. Inside the body, plain tags work
 * (<p>, <h2>, <ul>, <img>) and `class="cta"` on a link makes it a rust button.
 */
export function newsletterEmailHtml(opts: { bodyHtml: string; previewText?: string | null; unsubscribeToken?: string | null }) {
  const unsub = unsubscribeUrl(opts.unsubscribeToken);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(NEWSLETTER_NAME)}</title>
<style>
  body { margin:0; padding:0; background:#F2F0ED; font-family:${FONT}; }
  .body p, .body li { font-size:16px; line-height:1.7; color:#2B2B2B; margin:0 0 16px; }
  .body h2 { font-size:24px; line-height:1.25; color:#111111; margin:0 0 14px; font-weight:800; }
  .body h3 { font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:${RUST}; margin:24px 0 8px; }
  .body a { color:${RUST}; }
  .body img { max-width:100%; height:auto; border-radius:8px; }
  .body a.cta { display:inline-block; background:${RUST}; color:#FFFFFF !important; font-weight:700; font-size:15px; padding:13px 26px; border-radius:8px; text-decoration:none; }
</style></head>
<body>
${opts.previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.previewText)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F0ED;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:24px 32px;border-bottom:4px solid ${RUST};">
      <img src="${BASE_URL}/brand/listworx-wordmark-light.png" alt="ListWorx" height="28" style="display:block;height:28px;width:auto;" />
      <p style="font-family:${FONT};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#888888;margin:10px 0 0;">${escapeHtml(NEWSLETTER_NAME)}</p>
    </td></tr>
    <tr><td class="body" style="padding:32px;">
      ${opts.bodyHtml}
    </td></tr>
    <tr><td style="padding:22px 32px;background:#1E1E1E;">
      <p style="font-family:${FONT};font-size:12px;line-height:1.6;color:#B5B5B5;margin:0 0 6px;">
        You're getting this because you signed up at listworx.co. Reply any time to reach Alex directly.
      </p>
      <p style="font-family:${FONT};font-size:12px;line-height:1.6;color:#8A8A8A;margin:0;">
        ${BUSINESS_ADDRESS}<br/>
        <a href="${unsub}" style="color:${RUST};">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Sends up to 100 emails per Resend call so big lists finish inside Netlify's function time limit. */
export async function sendNewsletterBatch(messages: { to: string; subject: string; html: string }[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL missing).');

  const ids: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        chunk.map((m) => ({
          from: from.includes('<') ? from : `${NEWSLETTER_NAME} <${from}>`,
          to: [m.to],
          subject: m.subject,
          html: m.html,
          reply_to: process.env.NEWSLETTER_REPLY_TO || 'adeyo@listworx.co',
        }))
      ),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `Resend error ${res.status}`);
    for (const d of json.data || []) ids.push(d.id);
  }
  return ids;
}

/** Newsletter body that teases a blog post and links back to it. */
export function newsletterBodyFromPost(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
}) {
  const url = `${BASE_URL}/blog/${post.slug}`;
  return [
    post.featured_image_url
      ? `<a href="${url}"><img src="${escapeHtml(post.featured_image_url)}" alt="${escapeHtml(post.title)}" style="margin:0 0 20px;" /></a>`
      : '',
    `<h2>${escapeHtml(post.title)}</h2>`,
    post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : '',
    `<p>[Add a few lines in your own words: the one takeaway, or a quick story from the job site.]</p>`,
    `<p style="margin:24px 0;"><a href="${url}" class="cta">Read the full article →</a></p>`,
    `<h3>Need a pro you can trust?</h3>`,
    `<p>Every contractor on ListWorx is IronClad Verified: licensed, insured, and held to real standards. <a href="${BASE_URL}/request">Get matched free →</a></p>`,
    `<p>— Alex Deyo, ListWorx</p>`,
  ]
    .filter(Boolean)
    .join('\n');
}
