import type { MetadataRoute } from 'next';

// SITE_NOINDEX=true is set only on non-production sites (e.g. the
// listworx-security-test Netlify project) so search engines never index them.
// Production leaves it unset and keeps the normal rules below.
const NOINDEX = process.env.SITE_NOINDEX === 'true';

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/aces-demo'] },
    sitemap: 'https://listworx.co/sitemap.xml',
  };
}
