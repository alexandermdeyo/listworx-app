import { notFound } from 'next/navigation';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import { getPublishedPost, type BlogPost } from '@/lib/blog';
import { SITE_URL, SITE_NAME, ORGANIZATION_ID, DEFAULT_OG_IMAGE } from '@/lib/seo';

// Rendered on the server for every request so the article text is in the HTML
// that search engines and AI crawlers receive, and edits show up immediately
// (same freshness as the previous in-browser fetch).
export const dynamic = 'force-dynamic';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function renderBody(text: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('# ')) {
      return <h2 key={i} className="text-2xl font-bold text-mkt-ink mt-8 mb-3">{trimmed.slice(2)}</h2>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={i} className="text-xl font-bold text-mkt-ink mt-6 mb-2">{trimmed.slice(3)}</h3>;
    }
    if (trimmed.startsWith('### ')) {
      return <h4 key={i} className="text-lg font-semibold text-mkt-ink mt-5 mb-2">{trimmed.slice(4)}</h4>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 text-mkt-ink/90 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
        </ul>
      );
    }
    if (/^\d+\. /.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => /^\d+\. /.test(l));
      return (
        <ol key={i} className="list-decimal list-inside space-y-1.5 text-mkt-ink/90 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.replace(/^\d+\. /, '')}</li>)}
        </ol>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-2 border-lw-rust pl-4 py-1 my-4 text-mkt-ink/70 italic">
          {trimmed.slice(2)}
        </blockquote>
      );
    }

    const withInline = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return (
      <p key={i} className="text-mkt-ink/90 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: withInline }} />
    );
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post: BlogPost | null = await getPublishedPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        ...(post.excerpt ? { description: post.excerpt } : {}),
        image: post.featured_image_url || DEFAULT_OG_IMAGE.url,
        ...(post.published_at ? { datePublished: post.published_at } : {}),
        ...(post.updated_at || post.published_at ? { dateModified: post.updated_at || post.published_at } : {}),
        author: { '@type': 'Person', name: post.author_name || 'ListWorx Team' },
        publisher: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: SITE_NAME },
        mainEntityOfPage: url,
        url,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-mkt-ink mkt-scope">
      <JsonLd data={structuredData} />
      <Navigation variant="light" />

      {/* Hero image */}
      {post.featured_image_url && (
        <div className="w-full max-h-[480px] overflow-hidden bg-zinc-100">
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
            style={{ maxHeight: 480 }}
          />
        </div>
      )}

      <article className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">

        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-mkt-ink/60 hover:text-lw-rust transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> All Articles
        </Link>

        {/* Meta */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-xs text-mkt-ink/60 mb-4">
            <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{post.author_name}</span>
            {post.published_at && (
              <><span>·</span><span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(post.published_at)}</span></>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-mkt-ink leading-tight mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-mkt-ink/70 text-lg leading-relaxed border-l-2 border-lw-rust pl-4">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Divider */}
        <div className="border-t border-zinc-200 mb-8" />

        {/* Body */}
        {post.body ? (
          <div className="text-base">{renderBody(post.body)}</div>
        ) : (
          <p className="text-mkt-ink/60 italic">No content for this post yet.</p>
        )}

      </article>

      {/* Footer CTA */}
      <section className="bg-mkt-navy py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link href="/blog">
              <Button variant="outlineOrange">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
              </Button>
            </Link>
            <div className="flex gap-3">
              <Link href="/apply">
                <Button className="bg-lw-rust hover:bg-lw-rust-hover text-white">Apply as Contractor</Button>
              </Link>
              <Link href="/request">
                <Button variant="outlineOrange">Request a Contractor</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
