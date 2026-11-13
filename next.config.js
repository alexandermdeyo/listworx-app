/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true,
  },
  // Non-production sites (SITE_NOINDEX=true) tell search engines not to index
  // any page. Production leaves SITE_NOINDEX unset, so nothing changes there.
  async headers() {
    if (process.env.SITE_NOINDEX !== 'true') return [];
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};

module.exports = nextConfig;
