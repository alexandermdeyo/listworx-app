import type { Metadata } from 'next';

/** Public production origin. Used for canonical URLs, Open Graph, and the sitemap. */
export const SITE_URL = 'https://listworx.co';
export const SITE_NAME = 'ListWorx';
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/brand/listworx-og.png`,
  width: 1200,
  height: 630,
};

/**
 * Builds metadata for a public marketing page: unique title and description,
 * a self-referencing canonical URL, and matching Open Graph / Twitter tags.
 * `path` is the page's own path, e.g. '/realtors' ('' for the homepage).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

/**
 * Organization + WebSite structured data for the homepage.
 * Only verified, already-public facts. Location is city/state only — never a
 * street address (the business operates from a private residence).
 * No LocalBusiness type, reviews, or ratings.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const homepageStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/LW_Logo.png`,
      description:
        'ListWorx is a standards-based referral network that matches homeowners and realtors with vetted home service contractors. ListWorx does not perform home services itself.',
      slogan: 'Elevate the standard. Protect the brand. Deliver with integrity.',
      email: 'adeyo@listworx.co',
      telephone: '+1-615-362-4996',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gallatin',
        addressRegion: 'TN',
        addressCountry: 'US',
      },
      areaServed: [
        { '@type': 'City', name: 'Gallatin, Tennessee' },
        { '@type': 'City', name: 'Hendersonville, Tennessee' },
        { '@type': 'AdministrativeArea', name: 'Sumner County, Tennessee' },
        { '@type': 'City', name: 'Nashville, Tennessee' },
        { '@type': 'AdministrativeArea', name: 'Middle Tennessee' },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': ORGANIZATION_ID },
      inLanguage: 'en-US',
    },
  ],
};

/** Metadata for pages that should work normally but stay out of search results. */
export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: true },
  };
}
