'use client';

import { useEffect, useState } from 'react';
import {
  Youtube, Instagram, Facebook, Link as LinkIcon, Upload,
  ExternalLink, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface MediaItem {
  id: string;
  title: string;
  platform: string;
  url: string;
  thumbnail_url: string | null;
  description: string | null;
  is_featured: boolean;
  display_order: number;
}

const PLATFORM_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  youtube:   { label: 'YouTube',      icon: Youtube,   color: 'text-red-400',   bg: 'bg-red-950/30 border-red-900/40' },
  instagram: { label: 'Instagram',    icon: Instagram, color: 'text-pink-400',  bg: 'bg-pink-950/30 border-pink-900/40' },
  facebook:  { label: 'Facebook',     icon: Facebook,  color: 'text-blue-400',  bg: 'bg-blue-950/30 border-blue-900/40' },
  upload:    { label: 'Media File',   icon: Upload,    color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/40' },
  link:      { label: 'Link',         icon: LinkIcon,  color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700/40' },
  other:     { label: 'Link',         icon: LinkIcon,  color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700/40' },
};

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  return null;
}

function resolvedThumbnail(item: MediaItem): string | null {
  if (item.thumbnail_url) return item.thumbnail_url;
  if (item.platform === 'youtube') return getYouTubeThumbnail(item.url);
  return null;
}

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.other;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  const thumb = resolvedThumbnail(item);
  const meta = PLATFORM_META[item.platform] ?? PLATFORM_META.other;
  const Icon = meta.icon;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-2xl border bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-all group ${item.is_featured ? 'ring-1 ring-zinc-600/50' : 'border-zinc-800'}`}
    >
      {/* Media area */}
      <div className="relative">
        {thumb ? (
          <div className="relative aspect-video bg-zinc-800 overflow-hidden">
            <img
              src={thumb}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {item.platform === 'youtube' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-red-600 ml-0.5" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-zinc-800/60 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
            <Icon className={`h-14 w-14 ${meta.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
          </div>
        )}

        {item.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-900/90 text-zinc-200 border border-zinc-700/60 backdrop-blur-sm">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">{item.title}</h3>
          <PlatformBadge platform={item.platform} />
        </div>
        {item.description && (
          <p className="text-xs text-zinc-500 leading-relaxed mt-1.5 line-clamp-2">{item.description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
          <ExternalLink className="h-3.5 w-3.5" />
          Open on {meta.label}
        </span>
      </div>
    </a>
  );
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Media' },
  { value: 'youtube', label: 'Videos' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
];

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/media')
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featured = items.filter(i => i.is_featured);
  const filtered = filter === 'all' ? items : items.filter(i => i.platform === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navigation />

      {/* Hero */}
      <section className="relative py-20 md:py-28 border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(39,39,42,0.6)_0%,_transparent_60%)] pointer-events-none" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">ListWorx Media</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Videos & Content
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
              Watch how ListWorx works, see what our partners are up to, and get insights into the IronClad Standards network.
            </p>
          </div>
        </div>
      </section>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <section className="py-14 md:py-20 border-b border-zinc-800/60">
          <div className="container mx-auto px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6">Featured</p>
            <div className={`grid gap-6 ${featured.length === 1 ? 'max-w-2xl' : featured.length === 2 ? 'sm:grid-cols-2 max-w-4xl' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {featured.map(item => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Media */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {filter === 'all' ? 'All Media' : FILTER_OPTIONS.find(f => f.value === filter)?.label}
              {!loading && <span className="text-zinc-700 ml-2">({filtered.length})</span>}
            </p>
            <div className="flex gap-2 flex-wrap">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    filter === opt.value
                      ? 'bg-white text-zinc-900 border-white'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-zinc-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-full bg-zinc-800/60 flex items-center justify-center mx-auto mb-4">
                <Youtube className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-base mb-1">No media here yet</p>
              <p className="text-zinc-600 text-sm">Check back soon for videos and content from ListWorx.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-zinc-800/60">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to join the network?</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Partner with ListWorx as a vetted contractor or submit a request as a realtor.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contractor-portal">
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
