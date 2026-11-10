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

/** Metadata for pages that should work normally but stay out of search results. */
export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: true },
  };
}
