'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function PostCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-700 transition-all">
          {post.featured_image_url && (
            <div className="aspect-[2/1] overflow-hidden bg-zinc-800">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
              <span className="flex items-center gap-1.5"><User className="h-3 w-3" />{post.author_name}</span>
              {post.published_at && <><span>·</span><span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(post.published_at)}</span></>}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-zinc-200 transition-colors leading-snug">{post.title}</h2>
            {post.excerpt && <p className="text-zinc-400 leading-relaxed mb-4 text-sm md:text-base line-clamp-3">{post.excerpt}</p>}
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#e07b39] group-hover:gap-2.5 transition-all">
              Read article <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-700 transition-all h-full flex flex-col">
        {post.featured_image_url && (
          <div className="aspect-video overflow-hidden bg-zinc-800">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2.5">
            {post.published_at && <span>{formatDate(post.published_at)}</span>}
          </div>
          <h2 className="text-base font-semibold text-white mb-2 group-hover:text-zinc-200 transition-colors leading-snug line-clamp-2">{post.title}</h2>
          {post.excerpt && <p className="text-zinc-500 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">{post.excerpt}</p>}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-600">{post.author_name}</span>
            <span className="text-xs font-medium text-[#e07b39] group-hover:underline">Read more</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const [hero, ...rest] = posts;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-zinc-800/60">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">ListWorx Blog</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Insights & Updates
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              Guides, contractor tips, market updates, and everything you need to know about the ListWorx IronClad network.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-zinc-800" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-1/4" />
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-full" />
                    <div className="h-3 bg-zinc-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-28">
              <div className="w-16 h-16 rounded-full bg-zinc-800/60 flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-base mb-1">No posts yet</p>
              <p className="text-zinc-600 text-sm">Check back soon for articles and updates from ListWorx.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Featured / hero post */}
              {hero && (
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Latest</p>
                  <PostCard post={hero} featured />
                </div>
              )}

              {/* Remaining posts */}
              {rest.length > 0 && (
                <>
                  <div className="pt-2 border-t border-zinc-800/60">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mt-8 mb-6">More Articles</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {rest.map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-zinc-800/60">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to work with vetted contractors?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Join the ListWorx IronClad network as a contractor or submit a free request.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/apply">
              <Button className="bg-[#e07b39] hover:bg-[#c96a2e] text-white px-6">Apply as Contractor</Button>
            </Link>
            <Link href="/request">
              <Button variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 px-6">Request a Contractor</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
