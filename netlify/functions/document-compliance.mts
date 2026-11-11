// Netlify Scheduled Function: runs the daily document-compliance job.
// Scheduled functions run only on the published production deploy, never on
// deploy previews. Requires the CRON_SECRET environment variable (set the same
// value in Netlify site settings; it never reaches the browser).
// 13:00 UTC = 7:00 AM Central (standard time) / 8:00 AM (daylight time).
export default async () => {
  const base = process.env.URL; // Netlify sets this to the site's main URL
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error('[document-compliance] missing URL or CRON_SECRET; skipped');
    return;
  }
  const res = await fetch(`${base}/api/cron/document-compliance`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  console.log('[document-compliance]', res.status, await res.text());
};

export const config = { schedule: '0 13 * * *' };
