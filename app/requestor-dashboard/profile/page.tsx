'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-browser';
import {
  LayoutDashboard,
  Home,
  User as User2,
  Users,
  Plus,
  ClipboardList,
  Settings,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Camera,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ─── Nav (mirrors dashboard) ──────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'my-listings', label: 'My Listings',    icon: Home,            href: '/requestor-dashboard#listing-studio' },
  { id: 'my-profile',  label: 'My Profile',     icon: User2,           href: '/requestor-dashboard/profile' },
  { id: 'vendors',     label: 'My Vendors',     icon: Users,           href: '/requestor-dashboard/vendors' },
  { id: 'submit',      label: 'Submit Request', icon: Plus,            href: '/request' },
  { id: 'requests',    label: 'My Requests',    icon: ClipboardList,   href: '/requestor-dashboard' },
  { id: 'settings',    label: 'Settings',       icon: Settings,        disabled: true },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandKitForm = {
  display_name:       string;
  job_title:          string;
  brokerage_name:     string;
  license_number:     string;
  phone:              string;
  email:              string;
  website:            string;
  headshot_url:       string;
  cover_photo_url:    string;
  personal_logo_url:  string;
  brokerage_logo_url: string;
  primary_color:      string;
  secondary_color:    string;
  instagram_handle:   string;
  facebook_url:       string;
  linkedin_url:       string;
  youtube_url:        string;
  bio:                string;
  preferred_cta:      string;
  disclaimer_text:    string;
};

type ListingRow = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  show_on_profile: boolean;
  listing_photos: { storage_path: string; is_primary: boolean; display_order: number }[];
};

type ShowcasePost = {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
  media_type: string;
};

const EMPTY_FORM: BrandKitForm = {
  display_name:       '',
  job_title:          '',
  brokerage_name:     '',
  license_number:     '',
  phone:              '',
  email:              '',
  website:            '',
  headshot_url:       '',
  cover_photo_url:    '',
  personal_logo_url:  '',
  brokerage_logo_url: '',
  primary_color:      '#E8621A',
  secondary_color:    '#1a1a1a',
  instagram_handle:   '',
  facebook_url:       '',
  linkedin_url:       '',
  youtube_url:        '',
  bio:                '',
  preferred_cta:      '',
  disclaimer_text:    '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  if (!n) return '';
  return `$${Number(n).toLocaleString()}`;
}

// ─── Photo thumbnail for listing cards (uses signed URL) ─────────────────────

function ListingThumb({ photos }: { photos: ListingRow['listing_photos'] }) {
  const [src, setSrc] = useState<string | null>(null);
  const photo = photos.find((p) => p.is_primary) ?? photos[0];

  useEffect(() => {
    if (!photo) return;
    fetch('/api/listing-studio/photo-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [photo.storage_path] }),
    })
      .then((r) => r.json())
      .then((d) => { const u = d.urls?.[0]?.signedUrl; if (u) setSrc(u); })
      .catch(() => {});
  }, [photo]);

  if (!photo || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
        <Camera className="h-5 w-5 text-zinc-600" />
      </div>
    );
  }
  return <img src={src} alt="" className="w-full h-full object-cover" />;
}

// ─── Image upload area ────────────────────────────────────────────────────────

function ImageUploadArea({
  label,
  url,
  field,
  aspect,
  circle,
  onUploaded,
  onClear,
}: {
  label: string;
  url: string;
  field: string;
  aspect: string;
  circle?: boolean;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('field', field);
      const res = await fetch('/api/realtor/brand-kit/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
    } catch (e) {
      console.error('Upload error', e);
    } finally {
      setUploading(false);
    }
  }

  const wrapClass = circle
    ? `relative overflow-hidden rounded-full border-2 border-dashed border-zinc-600 bg-zinc-800 ${aspect} flex items-center justify-center cursor-pointer hover:border-lw-rust transition`
    : `relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-800 ${aspect} flex items-center justify-center cursor-pointer hover:border-lw-rust transition`;

  return (
    <div>
      <p className="text-xs text-zinc-400 font-medium mb-2 uppercase tracking-wider">{label}</p>
      <div
        className={wrapClass}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-0.5 hover:bg-black transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : uploading ? (
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-zinc-500">
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <h3 className="text-white font-semibold text-base">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 font-medium mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-lw-rust transition';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const supabaseRef = useRef(createClient());
  const [userName, setUserName]     = useState('');
  const [userId, setUserId]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [form, setForm]             = useState<BrandKitForm>(EMPTY_FORM);
  const [listings, setListings]     = useState<ListingRow[]>([]);
  const [showcase, setShowcase]     = useState<ShowcasePost[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showUploading, setShowUploading] = useState(false);

  // ── Load user + brand kit data ──────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (user?.email) setUserName(user.email.split('@')[0]);
      if (user?.id)    setUserId(user.id);

      const res  = await fetch('/api/realtor/brand-kit');
      const data = await res.json();

      if (data.brandKit) {
        const bk = data.brandKit;
        setForm({
          display_name:       bk.display_name       || '',
          job_title:          bk.job_title          || '',
          brokerage_name:     bk.brokerage_name     || '',
          license_number:     bk.license_number     || '',
          phone:              bk.phone              || '',
          email:              bk.email              || '',
          website:            bk.website            || '',
          headshot_url:       bk.headshot_url        || '',
          cover_photo_url:    bk.cover_photo_url    || '',
          personal_logo_url:  bk.personal_logo_url  || '',
          brokerage_logo_url: bk.brokerage_logo_url || '',
          primary_color:      bk.primary_color      || '#E8621A',
          secondary_color:    bk.secondary_color    || '#1a1a1a',
          instagram_handle:   bk.instagram_handle   || '',
          facebook_url:       bk.facebook_url       || '',
          linkedin_url:       bk.linkedin_url       || '',
          youtube_url:        bk.youtube_url        || '',
          bio:                bk.bio                || '',
          preferred_cta:      bk.preferred_cta      || '',
          disclaimer_text:    bk.disclaimer_text    || '',
        });
      }

      if (Array.isArray(data.listings))  setListings(data.listings);
      if (Array.isArray(data.showcase))  setShowcase(data.showcase);
    } catch (e) {
      console.error('[profile] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  function set(key: keyof BrandKitForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // ── Save brand kit ──────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setSaveError('');
    try {
      const res  = await fetch('/api/realtor/brand-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle listing show_on_profile ──────────────────────────────────────────

  async function handleToggle(listingId: string, current: boolean) {
    setTogglingId(listingId);
    const next = !current;
    // Optimistic update
    setListings((prev) =>
      prev.map((l) => l.id === listingId ? { ...l, show_on_profile: next } : l)
    );
    try {
      const res = await fetch('/api/realtor/listings/show-on-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, show_on_profile: next }),
      });
      if (!res.ok) throw new Error('Toggle failed');
    } catch {
      // Revert on failure
      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, show_on_profile: current } : l)
      );
    } finally {
      setTogglingId(null);
    }
  }

  // ── Showcase: upload ────────────────────────────────────────────────────────

  async function handleShowcaseUpload(file: File) {
    setShowUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('field', 'showcase');
      const uploadRes  = await fetch('/api/realtor/brand-kit/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error('Upload failed');

      const createRes  = await fetch('/api/realtor/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url:     uploadData.url,
          caption:       '',
          display_order: showcase.length,
          media_type:    uploadData.media_type ?? 'image',
        }),
      });
      const createData = await createRes.json();
      if (createData.post) {
        setShowcase((prev) => [...prev, createData.post]);
      }
    } catch (e) {
      console.error('[profile] showcase upload error', e);
    } finally {
      setShowUploading(false);
    }
  }

  // ── Showcase: update caption ────────────────────────────────────────────────

  async function handleCaptionChange(id: string, caption: string) {
    setShowcase((prev) => prev.map((p) => p.id === id ? { ...p, caption } : p));
  }

  async function handleCaptionBlur(id: string, caption: string) {
    await fetch(`/api/realtor/showcase/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption }),
    }).catch(() => {});
  }

  // ── Showcase: delete ────────────────────────────────────────────────────────

  async function handleShowcaseDelete(id: string) {
    setShowcase((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/realtor/showcase/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  // ── Showcase: reorder ───────────────────────────────────────────────────────

  async function handleShowcaseMove(id: string, dir: 'up' | 'down') {
    const idx = showcase.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= showcase.length) return;

    const next = [...showcase];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const reindexed = next.map((p, i) => ({ ...p, display_order: i }));
    setShowcase(reindexed);

    // Persist both swapped rows
    await Promise.all([
      fetch(`/api/realtor/showcase/${reindexed[idx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: reindexed[idx].display_order }),
      }),
      fetch(`/api/realtor/showcase/${reindexed[swapIdx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: reindexed[swapIdx].display_order }),
      }),
    ]).catch(() => {});
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async function handleLogout() {
    try { await supabaseRef.current.auth.signOut({ scope: 'global' }); } catch {}
    window.location.href = '/login';
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout
        userName={userName || 'User'}
        pageTitle="MY PROFILE"
        navItems={NAV_ITEMS}
        activeNavId="my-profile"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading your brand kit...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userName={userName || 'User'}
      pageTitle="MY PROFILE"
      navItems={NAV_ITEMS}
      activeNavId="my-profile"
      onLogout={handleLogout}
    >
      <div className="p-6 max-w-3xl mx-auto pb-24 space-y-6">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}>
              Brand Kit &amp; Profile
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              This appears on your public profile, marketing materials, and vendor invites.
            </p>
          </div>
          {userId && (
            <Link href={`/realtors/${userId}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Profile
              </Button>
            </Link>
          )}
        </div>

        {/* ── Banners ───────────────────────────────────────────────────── */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Profile saved successfully.
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        {/* ── SECTION 1 — Hero ──────────────────────────────────────────── */}
        <Section title="Hero">
          {/* Cover photo */}
          <div className="relative mb-10">
            <ImageUploadArea
              label="Cover Photo"
              url={form.cover_photo_url}
              field="cover"
              aspect="w-full h-[200px]"
              onUploaded={(url) => set('cover_photo_url', url)}
              onClear={() => set('cover_photo_url', '')}
            />
            {/* Headshot — overlapping bottom-left */}
            <div className="absolute -bottom-8 left-6">
              <ImageUploadArea
                label=""
                url={form.headshot_url}
                field="headshot"
                aspect="w-[100px] h-[100px]"
                circle
                onUploaded={(url) => set('headshot_url', url)}
                onClear={() => set('headshot_url', '')}
              />
              <p className="text-xs text-zinc-400 text-center mt-1">Headshot</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Field label="Display Name">
              <input className={inputCls} placeholder="Jane Smith" value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)} />
            </Field>
            <Field label="Title">
              <select className={inputCls} value={form.job_title}
                onChange={(e) => set('job_title', e.target.value)}>
                <option value="">Select title</option>
                <option value="Realtor">Realtor</option>
                <option value="Broker">Broker</option>
                <option value="Agent">Agent</option>
                <option value="Broker Associate">Broker Associate</option>
                <option value="Luxury Specialist">Luxury Specialist</option>
              </select>
            </Field>
            <Field label="Brokerage Name">
              <input className={inputCls} placeholder="Benchmark Realty" value={form.brokerage_name}
                onChange={(e) => set('brokerage_name', e.target.value)} />
            </Field>
            <Field label="License Number">
              <input className={inputCls} placeholder="TN-123456" value={form.license_number}
                onChange={(e) => set('license_number', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 2 — Contact ───────────────────────────────────────── */}
        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <input className={inputCls} type="tel" placeholder="615-555-1234" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" placeholder="jane@brokerage.com" value={form.email}
                onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Website URL" hint="Include https://">
              <input className={inputCls} type="url" placeholder="https://yoursite.com" value={form.website}
                onChange={(e) => set('website', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 3 — Bio ───────────────────────────────────────────── */}
        <Section title="Bio">
          <Field
            label="About You"
            hint="Appears on your public profile and all printed marketing materials. Max 400 characters."
          >
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              maxLength={400}
              placeholder="Write a short bio that tells buyers and sellers what makes you the right choice..."
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
            <p className={`text-xs mt-1 ${form.bio.length >= 380 ? 'text-amber-400' : 'text-zinc-600'}`}>
              {form.bio.length} / 400
            </p>
          </Field>
        </Section>

        {/* ── SECTION 4 — Brand ─────────────────────────────────────────── */}
        <Section title="Brand">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Primary Color">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-zinc-700 shrink-0"
                    style={{ backgroundColor: form.primary_color || '#E8621A' }}
                  />
                  <input
                    className={inputCls}
                    type="text"
                    placeholder="#E8621A"
                    value={form.primary_color}
                    onChange={(e) => set('primary_color', e.target.value)}
                    maxLength={9}
                  />
                  <input
                    type="color"
                    value={form.primary_color || '#E8621A'}
                    onChange={(e) => set('primary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-zinc-700 bg-transparent shrink-0"
                    title="Pick primary color"
                  />
                </div>
              </Field>
              <Field label="Secondary Color">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-zinc-700 shrink-0"
                    style={{ backgroundColor: form.secondary_color || '#1a1a1a' }}
                  />
                  <input
                    className={inputCls}
                    type="text"
                    placeholder="#1a1a1a"
                    value={form.secondary_color}
                    onChange={(e) => set('secondary_color', e.target.value)}
                    maxLength={9}
                  />
                  <input
                    type="color"
                    value={form.secondary_color || '#1a1a1a'}
                    onChange={(e) => set('secondary_color', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-zinc-700 bg-transparent shrink-0"
                    title="Pick secondary color"
                  />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ImageUploadArea
                label="Personal Logo"
                url={form.personal_logo_url}
                field="personal_logo"
                aspect="w-full h-36"
                onUploaded={(url) => set('personal_logo_url', url)}
                onClear={() => set('personal_logo_url', '')}
              />
              <ImageUploadArea
                label="Brokerage Logo"
                url={form.brokerage_logo_url}
                field="brokerage_logo"
                aspect="w-full h-36"
                onUploaded={(url) => set('brokerage_logo_url', url)}
                onClear={() => set('brokerage_logo_url', '')}
              />
            </div>
          </div>
        </Section>

        {/* ── SECTION 5 — Social Links ───────────────────────────────────── */}
        <Section title="Social Links">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instagram">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input className={`${inputCls} pl-9`} placeholder="yourhandle (no @)" value={form.instagram_handle}
                  onChange={(e) => set('instagram_handle', e.target.value)} />
              </div>
            </Field>
            <Field label="Facebook">
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input className={`${inputCls} pl-9`} placeholder="https://facebook.com/..." value={form.facebook_url}
                  onChange={(e) => set('facebook_url', e.target.value)} />
              </div>
            </Field>
            <Field label="LinkedIn">
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input className={`${inputCls} pl-9`} placeholder="https://linkedin.com/in/..." value={form.linkedin_url}
                  onChange={(e) => set('linkedin_url', e.target.value)} />
              </div>
            </Field>
            <Field label="YouTube Channel URL">
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input className={`${inputCls} pl-9`} placeholder="https://youtube.com/@yourchannel" value={form.youtube_url}
                  onChange={(e) => set('youtube_url', e.target.value)} />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── SECTION 6 — Marketing Defaults ────────────────────────────── */}
        <Section title="Marketing Defaults">
          <div className="space-y-4">
            <Field label="Preferred CTA" hint="Shown on flyers, open house sheets, and social posts.">
              <input className={inputCls} placeholder="Call Jane at 615-555-1234 to schedule a private showing"
                value={form.preferred_cta} onChange={(e) => set('preferred_cta', e.target.value)} />
            </Field>
            <Field label="Disclaimer (optional)">
              <textarea className={`${inputCls} resize-none`} rows={3}
                placeholder="© 2025 Jane Smith, Benchmark Realty. Equal Housing Opportunity."
                value={form.disclaimer_text} onChange={(e) => set('disclaimer_text', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 7 — My Listings on Profile ────────────────────────── */}
        <Section title="My Listings on Profile">
          {listings.length === 0 ? (
            <p className="text-zinc-500 text-sm">No listings yet. Create one in Listing Studio.</p>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/40 p-3"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    <ListingThumb photos={listing.listing_photos} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{listing.address}</p>
                    <p className="text-zinc-400 text-xs">{listing.city}, {listing.state} · {formatPrice(listing.price)}</p>
                  </div>
                  {/* Toggle */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Show on profile</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(listing.id, listing.show_on_profile)}
                      disabled={togglingId === listing.id}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${
                        listing.show_on_profile ? 'bg-lw-rust' : 'bg-zinc-700'
                      } ${togglingId === listing.id ? 'opacity-50' : ''}`}
                      aria-label={listing.show_on_profile ? 'Shown on profile' : 'Hidden from profile'}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
                          listing.show_on_profile ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── SECTION 8 — Social Media Showcase ─────────────────────────── */}
        <Section title="Social Media Showcase">
          <p className="text-zinc-400 text-sm mb-4">
            Upload photos or videos from your social media posts. These appear in a grid on your public profile.
          </p>

          {/* Upload button */}
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-zinc-600 bg-zinc-800 hover:border-lw-rust px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition mb-5">
            {showUploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4" /> Add Photo or Video</>
            )}
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/x-m4v"
              className="hidden"
              disabled={showUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleShowcaseUpload(f);
                e.target.value = '';
              }}
            />
          </label>

          {showcase.length === 0 ? (
            <p className="text-zinc-600 text-sm">No showcase media yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {showcase.map((post, idx) => (
                <div key={post.id} className="group relative flex flex-col gap-2">
                  {/* Image or video */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                    {post.media_type === 'video' ? (
                      <video
                        src={post.image_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Controls overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-start justify-between p-1.5">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleShowcaseMove(post.id, 'up')}
                          disabled={idx === 0}
                          className="rounded bg-white/20 p-1 hover:bg-white/40 disabled:opacity-30 transition"
                        >
                          <ChevronUp className="h-3 w-3 text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShowcaseMove(post.id, 'down')}
                          disabled={idx === showcase.length - 1}
                          className="rounded bg-white/20 p-1 hover:bg-white/40 disabled:opacity-30 transition"
                        >
                          <ChevronDown className="h-3 w-3 text-white" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleShowcaseDelete(post.id)}
                        className="rounded bg-white/20 p-1 hover:bg-red-500/80 transition"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  </div>
                  {/* Caption */}
                  <input
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-lw-rust transition"
                    placeholder="Caption (optional)"
                    value={post.caption}
                    onChange={(e) => handleCaptionChange(post.id, e.target.value)}
                    onBlur={(e)  => handleCaptionBlur(post.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Sticky save bar ───────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-60 right-0 z-40 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 hidden sm:block">
            Changes are not saved automatically.
          </p>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto font-bold text-white px-8"
            style={{ backgroundColor: '#E8621A' }}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
