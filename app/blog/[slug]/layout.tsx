import type { Metadata } from 'next';
import { getPublishedPost } from '@/lib/blog';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

/**
 * Supplies the title, description, canonical, and share image that Google,
 * Facebook, and texts show for a post. Shares one cached query with the page.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const post = await getPublishedPost(params.slug);
    if (!post) return { title: 'Post Not Found | ListWorx', robots: { index: false, follow: true } };

    const url = `${SITE_URL}/blog/${post.slug}`;
    const description = post.excerpt || 'Homeowner advice and contractor know-how from ListWorx.';
    const images = post.featured_image_url ? [{ url: post.featured_image_url }] : [DEFAULT_OG_IMAGE];
    return {
      title: `${post.title} | ListWorx`,
      description,
      alternates: { canonical: url },
      openGraph: { title: post.title, description, url, type: 'article', publishedTime: post.published_at || undefined, images, siteName: 'ListWorx' },
      twitter: { card: 'summary_large_image', title: post.title, description, images: images.map((i) => i.url) },
    };
  } catch {
    return { title: 'Blog | ListWorx' };
  }
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
