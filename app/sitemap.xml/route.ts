import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const SITE_URL = 'https://listworx.co';

export const dynamic = 'force-dynamic';

/** Lists public pages and every published blog post for search engines. */
export async function GET() {
  const urls: { loc: string; lastmod?: string; priority: number }[] = [
    '', '/request', '/contractors', '/realtors', '/pricing', '/ironclad', '/about', '/faq', '/blog',
    '/media-partners', '/become-a-supplier-partner', '/become-a-brokerage-partner', '/contact', '/apply',
  ].map((path) => ({ loc: `${SITE_URL}${path}`, priority: path === '' ? 1 : 0.7 }));

  try {
    const supabase = createSupabaseAdminClient();
    const { data: posts } = await supabase.from('blog_posts').select('slug, updated_at, published_at').eq('is_draft', false);
    for (const p of posts || []) {
      urls.push({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: p.updated_at || p.published_at, priority: 0.8 });
    }
  } catch {
    // Static pages still listed if the database is unreachable.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } });
}
