import { cache } from 'react';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { HERO_COLUMNS, type HeroSettings } from '@/lib/content/hero-image';

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

/** Hero display settings (HeroSettings) and alt text are optional so pages work before those columns exist. */
export interface BlogPostSummary extends HeroSettings {
  featured_image_alt?: string | null;
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

const BASE_COLUMNS = 'id, title, slug, excerpt, featured_image_url, author_name, published_at, created_at, updated_at';
const SUMMARY_COLUMNS = `${BASE_COLUMNS}, featured_image_alt, ${HERO_COLUMNS}`;

/**
 * Runs a query with the hero/alt columns, and again without them if the database
 * doesn't have them yet (e.g. code deployed before the migration). Keeps the public
 * blog working in either order.
 */
async function withHeroFallback<T>(run: (columns: string) => PromiseLike<{ data: T; error: { message: string } | null }>) {
  const first = await run(SUMMARY_COLUMNS);
  if (first.error && /column .* does not exist|featured_image_(alt|focus|fit|width|height)/i.test(first.error.message)) {
    return run(BASE_COLUMNS);
  }
  return first;
}

/** Published posts, newest first. Throws on database errors so callers can decide. */
export const getPublishedPosts = cache(async (): Promise<BlogPostSummary[]> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await withHeroFallback((columns) =>
    supabase
      .from('blog_posts')
      .select(columns)
      .eq('is_draft', false)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  );
  if (error) throw new Error(`blog list query failed: ${error.message}`);
  return ((data || []) as unknown) as BlogPostSummary[];
});

/**
 * One published post by slug, or null if there is no published post with that slug.
 * Wrapped in React cache() so the layout's metadata and the page share one query.
 */
export const getPublishedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await withHeroFallback((columns) =>
    supabase
      .from('blog_posts')
      .select(`${columns}, body`)
      .eq('slug', slug)
      .eq('is_draft', false)
      .maybeSingle()
  );
  if (error) throw new Error(`blog post query failed: ${error.message}`);
  return ((data as unknown) as BlogPost) || null;
});
