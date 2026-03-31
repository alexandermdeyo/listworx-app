'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CircleAlert as AlertCircle,
  Loader as Loader2,
  LogOut,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ExternalLink,
  Save,
  X,
  FileText,
  Globe,
  PenLine,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  featured_image_url: '',
  author_name: 'ListWorx Team',
  is_published: false,
};

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminBlogPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') { setAccessDenied(true); setIsAuthenticated(false); }
      else router.push('/login?redirect=/admin/crm/blog');
      return;
    }
    setIsAuthenticated(true);
    loadPosts();
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog?all=true');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (value: string) => {
    setForm(f => ({
      ...f,
      title: value,
      slug: slugManuallyEdited ? f.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm(f => ({ ...f, slug: slugify(value) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Title and slug are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        body: form.body.trim() || null,
        featured_image_url: form.featured_image_url.trim() || null,
        author_name: form.author_name.trim() || 'ListWorx Team',
        is_published: form.is_published,
      };

      const res = await fetch('/api/blog', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setSlugManuallyEdited(false);
      await loadPosts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      const res = await fetch('/api/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, is_published: !post.is_published }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_published: !p.is_published } : p));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      body: post.body || '',
      featured_image_url: post.featured_image_url || '',
      author_name: post.author_name,
      is_published: post.is_published,
    });
    setEditingId(post.id);
    setSlugManuallyEdited(true);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setError('');
  };

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login'); } catch (e) { console.error(e); }
  };

  const published = posts.filter(p => p.is_published);
  const drafts = posts.filter(p => !p.is_published);

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

      <div className="container mx-auto px-4 py-10 max-w-5xl">

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
              <h1 className="text-2xl font-bold text-white">Blog</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Create and manage articles, guides, and updates</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/blog" target="_blank">
              <Button variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View Blog
              </Button>
            </Link>
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setSlugManuallyEdited(false); setError(''); }}
              className="bg-lw-rust hover:bg-lw-rust-hover text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Post
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

        {/* Editor Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-lw-dark-border/60 bg-lw-dark-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <PenLine className="h-5 w-5 text-lw-rust" />
                {editingId ? 'Edit Post' : 'New Post'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeForm} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Title <span className="text-red-400">*</span></label>
                <Input
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="e.g. How to Choose a Vetted Contractor in 2025"
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500 text-base"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                  Slug <span className="text-red-400">*</span>
                  <span className="text-zinc-600 ml-2 font-normal">listworx.com/blog/<span className="text-zinc-400">{form.slug || 'your-slug-here'}</span></span>
                </label>
                <Input
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="how-to-choose-a-vetted-contractor"
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500 font-mono text-sm"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Excerpt <span className="text-zinc-600 font-normal">(shown on listing page and used for SEO description)</span></label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  placeholder="A short summary of the post — 1 or 2 sentences."
                  rows={2}
                  className="w-full rounded-md bg-lw-dark-surface border border-lw-dark-border text-white placeholder:text-zinc-500 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-lw-rust/40"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                  Body <span className="text-zinc-600 font-normal">(plain text or markdown — rendered as-is)</span>
                </label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Write your post content here..."
                  rows={16}
                  className="w-full rounded-md bg-lw-dark-surface border border-lw-dark-border text-white placeholder:text-zinc-500 text-sm px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-lw-rust/40 font-mono leading-relaxed"
                />
              </div>

              {/* Row: image + author */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Featured Image URL <span className="text-zinc-600 font-normal">(optional)</span></label>
                  <Input
                    value={form.featured_image_url}
                    onChange={e => setForm(f => ({ ...f, featured_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Author Name</label>
                  <Input
                    value={form.author_name}
                    onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                    placeholder="ListWorx Team"
                    className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Published toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors ${form.is_published ? 'bg-emerald-600' : 'bg-lw-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-zinc-300">
                    {form.is_published ? 'Published — visible to public' : 'Draft — not visible to public'}
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeForm} className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="bg-lw-rust hover:bg-lw-rust-hover text-white min-w-[120px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" />{editingId ? 'Save Changes' : 'Create Post'}</>}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total Posts', value: posts.length, color: 'text-zinc-300' },
            { label: 'Published', value: published.length, color: 'text-emerald-400' },
            { label: 'Drafts', value: drafts.length, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-lw-dark-border/50 bg-lw-dark-card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Posts list */}
        {posts.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No posts yet. Create your first post above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...published, ...drafts].map(post => (
              <div key={post.id} className={`rounded-2xl border bg-lw-dark-card p-5 flex flex-wrap items-start gap-4 transition-all ${post.is_published ? 'border-lw-dark-border/50' : 'border-lw-dark/40 opacity-70'}`}>
                {/* Thumbnail */}
                {post.featured_image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-lw-dark-surface">
                    <img src={post.featured_image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-white leading-snug">{post.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${post.is_published ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-amber-950/30 text-amber-500 border-amber-800/30'}`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {post.excerpt && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-1.5">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className="font-mono">/blog/{post.slug}</span>
                    <span>·</span>
                    <span>{post.author_name}</span>
                    <span>·</span>
                    <span>{post.is_published && post.published_at ? formatDate(post.published_at) : `Created ${formatDate(post.created_at)}`}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {post.is_published && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      title="View post">
                      <Globe className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => togglePublished(post)}
                    title={post.is_published ? 'Unpublish' : 'Publish'}
                    className={`p-1.5 rounded-lg transition-colors ${post.is_published ? 'bg-emerald-950/30 text-emerald-500 hover:bg-red-950/30 hover:text-red-400' : 'bg-lw-dark-surface text-zinc-400 hover:bg-emerald-950/30 hover:text-emerald-400'}`}
                  >
                    {post.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
