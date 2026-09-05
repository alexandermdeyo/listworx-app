'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert as AlertCircle,
  Loader as Loader2,
  LogOut,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Star,
  Save,
  X,
  Upload,
  Handshake,
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface PromoPartner {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  is_visible: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = {
  name: '',
  link_url: '',
  logo_url: '',
  is_visible: false,
  is_featured: false,
  display_order: 0,
};

export default function AdminPartnersPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [token, setToken] = useState('');
  const [partners, setPartners] = useState<PromoPartner[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeader = (t = token) => ({ Authorization: `Bearer ${t}` });

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') {
        setAccessDenied(true);
        setIsAuthenticated(false);
      } else {
        router.push('/login?redirect=/admin/crm/partners');
      }
      setLoading(false);
      return;
    }
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || '';
    setToken(accessToken);
    setIsAuthenticated(true);
    await loadPartners(accessToken);
    setLoading(false);
  };

  const loadPartners = async (t = token) => {
    try {
      const res = await fetch('/api/promo-partners?all=true', { headers: authHeader(t) });
      if (!res.ok) throw new Error('Could not load partners');
      const data = await res.json();
      setPartners(Array.isArray(data.partners) ? data.partners : []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Logo must be under 5 MB');
      const ext = file.name.split('.').pop() || 'png';
      const path = `promo-partners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: publicUrl }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, display_order: partners.length });
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (p: PromoPartner) => {
    setForm({
      name: p.name,
      link_url: p.link_url || '',
      logo_url: p.logo_url,
      is_visible: p.is_visible,
      is_featured: p.is_featured,
      display_order: p.display_order,
    });
    setEditingId(p.id);
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.logo_url.trim()) {
      setError('A name and an uploaded logo are both required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        link_url: form.link_url.trim() || null,
        logo_url: form.logo_url.trim(),
        is_visible: form.is_visible,
        is_featured: form.is_featured,
        display_order: Number(form.display_order) || 0,
      };
      const res = await fetch('/api/promo-partners', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      closeForm();
      await loadPartners();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const patchPartner = async (id: string, updates: Partial<PromoPartner>) => {
    try {
      const res = await fetch('/api/promo-partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      const updated = await res.json();
      setPartners((prev) =>
        prev
          .map((p) => (p.id === id ? updated : p))
          .sort(
            (a, b) =>
              Number(b.is_featured) - Number(a.is_featured) ||
              a.display_order - b.display_order,
          ),
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const move = (p: PromoPartner, dir: -1 | 1) => {
    const sorted = [...partners].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((x) => x.id === p.id);
    const swapWith = sorted[idx + dir];
    if (!swapWith) return;
    patchPartner(p.id, { display_order: swapWith.display_order });
    patchPartner(swapWith.id, { display_order: p.display_order });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this partner permanently?')) return;
    try {
      const res = await fetch(`/api/promo-partners?id=${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setPartners((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <div className="p-8 max-w-md text-center rounded-2xl bg-lw-dark-card border border-lw-dark-border">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-zinc-400 mb-6">Admin privileges required.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-lw-dark-border text-zinc-300">
              Go Home
            </Button>
            <Button onClick={handleSignOut} className="flex-1 bg-lw-rust hover:bg-lw-rust-hover text-white">
              Sign Out
            </Button>
          </div>
        </div>
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

  const ordered = [...partners].sort(
    (a, b) =>
      Number(b.is_featured) - Number(a.is_featured) || a.display_order - b.display_order,
  );
  const visibleCount = partners.filter((p) => p.is_visible).length;

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
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
              <h1 className="text-2xl font-bold text-white">Promo Partners</h1>
              <p className="text-zinc-400 text-sm mt-0.5">
                Logos for the homepage &ldquo;Trusted by local businesses&rdquo; strip. Hidden by
                default — the section only appears when at least one is visible.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNew} className="bg-lw-rust hover:bg-lw-rust-hover text-white">
              <Plus className="h-4 w-4 mr-1.5" /> New Partner
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-2xl border border-lw-dark-border/60 bg-lw-dark-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Handshake className="h-5 w-5 text-lw-rust" />
                {editingId ? 'Edit Partner' : 'New Partner'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeForm} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                  Logo <span className="text-red-400">*</span>
                  <span className="text-zinc-600 ml-2 font-normal">PNG or SVG-exported PNG with transparency works best · under 5 MB</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-32 shrink-0 rounded-lg border border-lw-dark-border bg-white/5 flex items-center justify-center overflow-hidden">
                    {form.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logo_url} alt="Logo preview" className="max-h-14 max-w-[120px] object-contain" />
                    ) : (
                      <span className="text-[10px] text-zinc-600">No logo</span>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-lw-dark-border bg-lw-dark-surface px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.logo_url ? 'Replace' : 'Upload'} logo
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFile} />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                  Business name <span className="text-red-400">*</span>
                  <span className="text-zinc-600 ml-2 font-normal">used as the logo&apos;s alt text</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gallatin Hardware Co."
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Link */}
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                  Link <span className="text-zinc-600 font-normal">(optional — wraps the logo, opens in a new tab)</span>
                </label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-lw-dark-surface border-lw-dark-border text-white placeholder:text-zinc-500"
                />
              </div>

              {/* Order */}
              <div className="w-40">
                <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Display order</label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                  className="bg-lw-dark-surface border-lw-dark-border text-white"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, is_visible: !f.is_visible }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors ${form.is_visible ? 'bg-emerald-600' : 'bg-lw-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_visible ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-zinc-300">{form.is_visible ? 'Visible on site' : 'Hidden'}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                    className={`w-10 h-5 rounded-full flex items-center transition-colors ${form.is_featured ? 'bg-lw-rust' : 'bg-lw-dark-border'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-0.5 ${form.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-zinc-300">{form.is_featured ? 'Featured (first + larger)' : 'Standard'}</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={closeForm} className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving || uploading} className="bg-lw-rust hover:bg-lw-rust-hover text-white min-w-[130px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" />{editingId ? 'Save Changes' : 'Add Partner'}</>}
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: partners.length, color: 'text-zinc-300' },
            { label: 'Visible', value: visibleCount, color: 'text-emerald-400' },
            { label: 'Featured', value: partners.filter((p) => p.is_featured).length, color: 'text-lw-rust' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-lw-dark-border/50 bg-lw-dark-card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {partners.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            <Handshake className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No partners yet. Add one above — the homepage strip stays hidden until one is visible.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordered.map((p, i) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-lw-dark-card p-4 flex flex-wrap items-center gap-4 transition-all ${p.is_visible ? 'border-lw-dark-border/50' : 'border-lw-dark/40 opacity-60'}`}
              >
                {/* order controls */}
                <div className="flex flex-col">
                  <button
                    onClick={() => move(p, -1)}
                    disabled={i === 0}
                    className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => move(p, 1)}
                    disabled={i === ordered.length - 1}
                    className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* logo */}
                <div className="h-12 w-28 shrink-0 rounded-lg bg-white/5 border border-lw-dark-border flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo_url} alt={p.name} className="max-h-10 max-w-[100px] object-contain" />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                    {p.is_featured && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-lw-rust/40 bg-lw-rust/10 text-lw-rust">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.is_visible ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-zinc-800/60 text-zinc-500 border-zinc-700'}`}>
                      {p.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  {p.link_url && (
                    <a href={p.link_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-lw-rust">
                      <ExternalLink className="h-3 w-3" />
                      {p.link_url}
                    </a>
                  )}
                </div>

                {/* actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => patchPartner(p.id, { is_featured: !p.is_featured })}
                    title={p.is_featured ? 'Unfeature' : 'Feature'}
                    className={`p-1.5 rounded-lg transition-colors ${p.is_featured ? 'bg-lw-rust/15 text-lw-rust' : 'bg-lw-dark-surface text-zinc-500 hover:text-lw-rust'}`}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => patchPartner(p.id, { is_visible: !p.is_visible })}
                    title={p.is_visible ? 'Hide' : 'Show'}
                    className={`p-1.5 rounded-lg transition-colors ${p.is_visible ? 'bg-emerald-950/30 text-emerald-500 hover:bg-red-950/30 hover:text-red-400' : 'bg-lw-dark-surface text-zinc-400 hover:bg-emerald-950/30 hover:text-emerald-400'}`}
                  >
                    {p.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg bg-lw-dark-surface text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                    title="Delete"
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
