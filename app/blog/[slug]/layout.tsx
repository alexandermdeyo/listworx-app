import type { Metadata } from 'next';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const SITE_URL = 'https://listworx.co';

/**
 * The article page renders in the browser, so this server layout supplies the
 * title, description, and share image Facebook, Google, and texts show for the link.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, featured_image_url, slug, published_at')
      .eq('slug', params.slug)
      .eq('is_draft', false)
      .maybeSingle();
    if (!post) return { title: 'Blog | ListWorx' };

    const url = `${SITE_URL}/blog/${post.slug}`;
    const description = post.excerpt || 'Homeowner advice and contractor know-how from ListWorx.';
    const images = post.featured_image_url ? [{ url: post.featured_image_url }] : [{ url: `${SITE_URL}/brand/listworx-og.png`, width: 1200, height: 630 }];
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
