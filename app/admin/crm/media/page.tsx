'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CircleAlert as AlertCircle,
  Loader as Loader2,
  LogOut,
  Plus,
  Trash2,
  Star,
  StarOff,
  Youtube,
  Instagram,
  Facebook,
  Link as LinkIcon,
  Upload,
  Eye,
  EyeOff,
  GripVertical,
  ChevronLeft,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
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
  is_active: boolean;
  created_at: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400' },
  { value: 'upload', label: 'Upload/File', icon: Upload, color: 'text-emerald-400' },
  { value: 'link', label: 'Other Link', icon: LinkIcon, color: 'text-zinc-400' },
];

const EMPTY_FORM = {
  title: '',
  platform: 'youtube',
  url: '',
  thumbnail_url: '',
  description: '',
  is_featured: false,
  display_order: 0,
};

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const p = PLATFORMS.find(p => p.value === platform);
  if (!p) return <LinkIcon className={className} />;
  const Icon = p.icon;
  return <Icon className={`${className} ${p.color}`} />;
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORMS.find(p => p.value === platform);
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-lw-dark-surface border border-lw-dark-border text-zinc-300 capitalize">
      <PlatformIcon platform={platform} className="h-3 w-3" />
      {p?.label ?? platform}
    </span>
  );
}

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

function matchesPlatformFilter(itemPlatform: string, activeFilter: string) {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'link') {
    return itemPlatform === 'link' || itemPlatform === 'other';
  }
  return itemPlatform === activeFilter;
}

export default function AdminMediaPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState('all');

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') { setAccessDenied(true); setIsAuthenticated(false); }
      else router.push('/login?redirect=/admin/crm/media');
      return;
    }
    setIsAuthenticated(true);
    loadItems();
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      setError('Title and URL are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        platform: form.platform,
        url: form.url.trim(),
        thumbnail_url: form.thumbnail_url.trim() || null,
        description: form.description.trim() || null,
        is_featured: form.is_featured,
        display_order: Number(form.display_order) || 0,
      };

      if (editingId) {
        const res = await fetch('/api/media', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadItems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleFeatured = async (item: MediaItem) => {
    try {
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_featured: !item.is_featured }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActive = async (item: MediaItem) => {
    try {
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (item: MediaItem) => {
    setForm({
      title: item.title,
      platform: item.platform,
      url: item.url,
      thumbnail_url: item.thumbnail_url || '',
      description: item.description || '',
      is_featured: item.is_featured,
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login'); } catch (e) { console.error(e); }
  };

  const filtered = items.filter(i => matchesPlatformFilter(i.platform, filterPlatform));

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-lw-dark-card border-lw-dark-border">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-zinc-400 mb-6">Admin privileges required.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-lw-dark-border text-zinc-300">Go Home</Button>
            <Button onClick={handleSignOut} className="flex-1 bg-lw-rust hover:bg-lw-rust-hover text-white">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-lw-rust" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/crm">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white px-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div className="w-px h-5 bg-lw-dark-border" />
            <div>
              <h1 className="text-2xl font-bold text-white">Media Library</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Manually curate videos, social links, and uploads for the public media page</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/media" target="_blank">
              <Button variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View Public Page
              </Button>
            </Link>
            <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError(''); }}
              className="bg-lw-rust hover:bg-lw-rust-hover text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Add Media
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-lw-dark-border/60 bg-lw-dark-card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Media Item' : 'Add Media Item'}</h2>
              <Button variant="ghost" size="sm" onClick={closeForm} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Title <span className="text-red-400">*</span></label>
                <Input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. How ListWorx Works — Intro Video"
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Platform / Source</label>
                <p className="text-[11px] text-zinc-500 mb-2">Choose a content type for this item (manual library entry, not connected account sync).</p>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, platform: p.value }))}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all
                        ${form.platform === p.value
                          ? 'border-lw-rust/60 bg-lw-rust/10 text-white'
                          : 'border-lw-dark-border bg-lw-dark-surface/50 text-zinc-400 hover:border-lw-dark-border/80'
                        }`}
                    >
                      <p.icon className={`h-4 w-4 ${form.platform === p.value ? p.color : ''}`} />
                      <span className="truncate w-full text-center leading-none">{p.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Selected: <span className="text-zinc-300">{PLATFORMS.find(p => p.value === form.platform)?.label ?? form.platform}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">URL <span className="text-red-400">*</span></label>
                <Input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Thumbnail URL <span className="text-zinc-500">(optional — auto-detected for YouTube)</span></label>
                <Input
                  value={form.thumbnail_url}
                  onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://... (override thumbnail)"
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Display Order</label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                  className="bg-lw-dark-surface border-lw-dark-border text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Description <span className="text-zinc-500">(optional)</span></label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description shown on the media page"
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors ${form.is_featured ? 'bg-lw-rust' : 'bg-lw-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                    Feature this item <span className="text-zinc-500 text-xs">(displayed in homepage / featured sections)</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeForm} className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-lw-rust hover:bg-lw-rust-hover text-white min-w-[100px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" />{editingId ? 'Save Changes' : 'Add Item'}</>}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Items', value: items.length, color: 'text-zinc-300' },
            { label: 'Active', value: items.filter(i => i.is_active).length, color: 'text-emerald-400' },
            { label: 'Featured', value: items.filter(i => i.is_featured && i.is_active).length, color: 'text-lw-rust' },
            { label: 'Hidden', value: items.filter(i => !i.is_active).length, color: 'text-zinc-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-lw-dark-border/50 bg-lw-dark-card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-5">
          <p className="text-[11px] text-zinc-500 mb-2">Filter by content type:</p>
          <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterPlatform('all')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${filterPlatform === 'all' ? 'border-lw-rust/60 bg-lw-rust/10 text-white' : 'border-lw-dark-border text-zinc-400 hover:border-lw-dark-border/80'}`}
          >
            All
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.value}
              onClick={() => setFilterPlatform(p.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all flex items-center gap-1.5 ${filterPlatform === p.value ? 'border-lw-rust/60 bg-lw-rust/10 text-white' : 'border-lw-dark-border text-zinc-400 hover:border-lw-dark-border/80'}`}
            >
              <PlatformIcon platform={p.value} className="h-3 w-3" />
              {p.label}
            </button>
          ))}
          </div>
        </div>

        {/* Items Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <LinkIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No media items yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const thumb = resolvedThumbnail(item);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-lw-dark-card overflow-hidden group transition-all ${
                    item.is_active ? 'border-lw-dark-border/50' : 'border-lw-dark-surface/50 opacity-50'
                  } ${item.is_featured ? 'ring-1 ring-lw-rust/30' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-lw-dark-surface/60 flex items-center justify-center overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <PlatformIcon platform={item.platform} className="h-12 w-12 opacity-30" />
                    )}
                    {item.is_featured && (
                      <div className="absolute top-2 left-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-lw-rust text-white shadow">Featured</span>
                      </div>
                    )}
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-lw-dark/80 text-zinc-400 border border-lw-dark-border">Hidden</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{item.title}</h3>
                      <PlatformBadge platform={item.platform} />
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-zinc-600 truncate mb-3">{item.url}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => toggleFeatured(item)}
                        title={item.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        className={`p-1.5 rounded-lg transition-colors ${item.is_featured ? 'bg-lw-rust/20 text-lw-rust hover:bg-lw-rust/30' : 'bg-lw-dark-surface text-zinc-400 hover:text-lw-rust hover:bg-lw-rust/10'}`}
                      >
                        {item.is_featured ? <Star className="h-3.5 w-3.5" /> : <StarOff className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        title={item.is_active ? 'Hide item' : 'Show item'}
                        className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => openEdit(item)}
                        className="ml-auto text-xs px-3 py-1 rounded-lg bg-lw-dark-surface text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
