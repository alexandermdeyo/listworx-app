import { sendEmail } from '@/lib/send-email';

/** Where admin alerts go. Set ADMIN_NOTIFICATION_EMAIL to change (comma-separate for several). */
export const ADMIN_EMAILS = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'adeyo@listworx.co')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

/** Simple ListWorx-branded email shell. `body` is trusted HTML (escape user input first). */
export function brandedEmail(opts: { kicker?: string; title: string; body: string; ctaLabel?: string; ctaHref?: string }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F2F2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F2;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#1A1A1A;padding:18px 32px;"><img src="${BASE_URL}/LW_LOGO.png" alt="ListWorx" width="120" style="display:block;border:0;max-width:120px;height:auto;"></td></tr>
<tr><td style="background:#E85000;height:4px;font-size:4px;line-height:4px;">&nbsp;</td></tr>
<tr><td style="padding:30px 32px 8px;font-family:${FONT};">
${opts.kicker ? `<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E85000;">${esc(opts.kicker)}</p>` : ''}
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1A1A1A;">${esc(opts.title)}</h1>
<div style="font-size:15px;line-height:1.7;color:#444;">${opts.body}</div>
${opts.ctaHref ? `<p style="margin:26px 0 8px;"><a href="${esc(opts.ctaHref)}" style="display:inline-block;background:#E85000;color:#fff;text-decoration:none;font-weight:700;padding:13px 28px;border-radius:7px;">${esc(opts.ctaLabel || 'Open')}</a></p>` : ''}
</td></tr>
<tr><td style="padding:22px 32px 26px;font-family:${FONT};font-size:12px;color:#888;border-top:1px solid #eee;">
<strong style="color:#444;">ListWorx LLC</strong> · 2147 Springdale Ln F104, Gallatin, TN 37066 · 615-362-4996
</td></tr></table></td></tr></table></body></html>`;
}

/** Two-column details table for admin alerts. Values are escaped. */
export function detailRows(rows: Array<[string, unknown]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;border-collapse:separate;margin:8px 0 4px;">${rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(
      ([k, v], i, arr) =>
        `<tr><td style="padding:10px 14px;background:#f7f7f7;width:34%;vertical-align:top;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#777;${i < arr.length - 1 ? 'border-bottom:1px solid #eee;' : ''}">${esc(k)}</td><td style="padding:10px 14px;font-size:14px;color:#222;white-space:pre-wrap;${i < arr.length - 1 ? 'border-bottom:1px solid #eee;' : ''}">${esc(v)}</td></tr>`,
    )
    .join('')}</table>`;
}

/** Sends an alert to the admin inbox. Never throws. */
export async function notifyAdmin(subject: string, html: string, replyTo?: string) {
  try {
    await sendEmail({ to: ADMIN_EMAILS, subject, html, replyTo });
    return true;
  } catch (err) {
    console.error('[notifyAdmin] failed:', subject, err);
    return false;
  }
}

/** Calls the send-contractor-email edge function with the server key. Never throws. */
export async function sendContractorTemplate(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[sendContractorTemplate] failed:', payload.type, text);
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('[sendContractorTemplate] error:', payload.type, err);
    return { ok: false, error: err?.message || 'send failed' };
  }
}
