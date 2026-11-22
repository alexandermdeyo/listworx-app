/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true,
  },
  // The old Founding/Standard price list ($100-$365) and the Founding Partner
  // enrollment page are retired. Send both to /contractors, which shows the
  // current Network (free) / Growth / Business Pro memberships. Temporary (307)
  // so the paths can be reused later without browsers caching the redirect.
  async redirects() {
    return [
      { source: '/founding-partner', destination: '/contractors', permanent: false },
    ];
  },
  // Non-production sites (SITE_NOINDEX=true) tell search engines not to index
  // any page. Production leaves SITE_NOINDEX unset, so nothing changes there.
  async headers() {
    if (process.env.SITE_NOINDEX !== 'true') return [];
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

module.exports = nextConfig;
