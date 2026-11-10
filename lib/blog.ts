import { cache } from 'react';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

/**
 * Server-side reads of PUBLISHED blog posts for the public blog pages.
 *
 * Server-only: this uses the service-role client, whose key is not a
 * NEXT_PUBLIC_ variable and is never sent to the browser. Only import this
 * from server components, layouts, or route handlers — never from a file
 * marked 'use client'. Queries always filter is_draft = false, matching the
 * public behaviour of /api/blog.
 */

if (typeof window !== 'undefined') {
  throw new Error('lib/blog.ts is server-only and must not be imported in client code.');
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface BlogPost extends BlogPostSummary {
  body: string | null;
}

const SUMMARY_COLUMNS = 'id, title, slug, excerpt, featured_image_url, author_name, published_at, created_at, updated_at';

/** Published posts, newest first. Throws on database errors so callers can decide. */
export const getPublishedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SUMMARY_COLUMNS)
    .eq('is_draft', false)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`blog list query failed: ${error.message}`);
  return (data || []) as BlogPostSummary[];
});

/**
 * One published post by slug, or null if there is no published post with that slug.
 * Wrapped in React cache() so the layout's metadata and the page share one query.
 */
export const getPublishedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`${SUMMARY_COLUMNS}, body`)
    .eq('slug', slug)
    .eq('is_draft', false)
    .maybeSingle();
  if (error) throw new Error(`blog post query failed: ${error.message}`);
  return (data as BlogPost) || null;
});
