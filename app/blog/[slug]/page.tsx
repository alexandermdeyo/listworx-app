'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

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
      return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-3">{trimmed.slice(2)}</h2>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={i} className="text-xl font-bold text-white mt-6 mb-2">{trimmed.slice(3)}</h3>;
    }
    if (trimmed.startsWith('### ')) {
      return <h4 key={i} className="text-lg font-semibold text-zinc-200 mt-5 mb-2">{trimmed.slice(4)}</h4>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* '));
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 text-zinc-300 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
        </ul>
      );
    }
    if (/^\d+\. /.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => /^\d+\. /.test(l));
      return (
        <ol key={i} className="list-decimal list-inside space-y-1.5 text-zinc-300 my-3 pl-1">
          {items.map((item, j) => <li key={j}>{item.replace(/^\d+\. /, '')}</li>)}
        </ol>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="border-l-2 border-[#e07b39] pl-4 py-1 my-4 text-zinc-400 italic">
          {trimmed.slice(2)}
        </blockquote>
      );
    }

    const withInline = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return (
      <p key={i} className="text-zinc-300 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: withInline }} />
    );
  });
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog?slug=${encodeURIComponent(slug)}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return; }
        const data = await r.json();
        setPost(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navigation />
        <div className="container mx-auto px-4 py-20 max-w-3xl animate-pulse space-y-4">
          <div className="h-3 bg-zinc-800 rounded w-1/4" />
          <div className="h-8 bg-zinc-800 rounded w-3/4" />
          <div className="h-8 bg-zinc-800 rounded w-2/3" />
          <div className="aspect-[2/1] bg-zinc-800 rounded-2xl mt-6" />
          <div className="space-y-3 mt-8">
            {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-zinc-800 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navigation />
        <div className="container mx-auto px-4 py-28 text-center">
          <p className="text-zinc-500 text-lg mb-2">Post not found</p>
          <p className="text-zinc-600 text-sm mb-6">This article may have been removed or the URL is incorrect.</p>
          <Link href="/blog">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero image */}
      {post.featured_image_url && (
        <div className="w-full max-h-[480px] overflow-hidden bg-zinc-900">
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
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" /> All Articles
        </Link>

        {/* Meta */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
            <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{post.author_name}</span>
            {post.published_at && (
              <><span>·</span><span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(post.published_at)}</span></>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-zinc-400 text-lg leading-relaxed border-l-2 border-[#e07b39] pl-4">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Divider */}
        <div className="border-t border-zinc-800 mb-8" />

        {/* Body */}
        {post.body ? (
          <div className="text-base">{renderBody(post.body)}</div>
        ) : (
          <p className="text-zinc-500 italic">No content for this post yet.</p>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link href="/blog">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
              </Button>
            </Link>
            <div className="flex gap-3">
              <Link href="/contractor-portal">
                <Button className="bg-[#e07b39] hover:bg-[#c96a2e] text-white">Apply as Contractor</Button>
              </Link>
              <Link href="/request">
                <Button variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800">Request a Contractor</Button>
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
