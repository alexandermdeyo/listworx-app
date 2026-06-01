'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from 'lucide-react';

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',      icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'my-listings', label: 'My Listings',    icon: Home,            href: '/requestor-dashboard#listing-studio' },
  { id: 'my-profile',  label: 'My Profile',     icon: User2,           href: '/requestor-dashboard/profile' },
  { id: 'my-brand',    label: 'My Brand',       icon: Palette,         href: '/requestor-dashboard/brand' },
  { id: 'vendors',     label: 'My Vendors',     icon: Users,           href: '/requestor-dashboard/vendors' },
  { id: 'submit',      label: 'Submit Request', icon: Plus,            href: '/request' },
  { id: 'requests',    label: 'My Requests',    icon: ClipboardList,   href: '/requestor-dashboard' },
  { id: 'settings',    label: 'Settings',       icon: Settings,        disabled: true },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandForm = {
  display_name:       string;
  job_title:          string;
  brokerage_name:     string;
  license_number:     string;
  bio:                string;
  preferred_cta:      string;
  disclaimer_text:    string;
  phone:              string;
  email:              string;
  website:            string;
  primary_color:      string;
  secondary_color:    string;
  accent_color:       string;
  headshot_url:       string;
  personal_logo_url:  string;
  brokerage_logo_url: string;
  cover_photo_url:    string;
  instagram_handle:   string;
  facebook_url:       string;
  linkedin_url:       string;
  youtube_url:        string;
};

const EMPTY_FORM: BrandForm = {
  display_name:       '',
  job_title:          '',
  brokerage_name:     '',
  license_number:     '',
  bio:                '',
  preferred_cta:      '',
  disclaimer_text:    '',
  phone:              '',
  email:              '',
  website:            '',
  primary_color:      '#E8621A',
  secondary_color:    '#1a1a1a',
  accent_color:       '#ffffff',
  headshot_url:       '',
  personal_logo_url:  '',
  brokerage_logo_url: '',
  cover_photo_url:    '',
  instagram_handle:   '',
  facebook_url:       '',
  linkedin_url:       '',
  youtube_url:        '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-lw-rust transition';

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

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg border border-zinc-700 shrink-0"
          style={{ backgroundColor: value || '#E8621A' }}
        />
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={9}
          placeholder="#E8621A"
        />
        <input
          type="color"
          value={value || '#E8621A'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-zinc-700 bg-transparent shrink-0 p-0.5"
          title={`Pick ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

function ImageUpload({
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
      const res  = await fetch('/api/realtor/brand-kit/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) onUploaded(data.url);
    } catch (e) {
      console.error('Upload error', e);
    } finally {
      setUploading(false);
    }
  }

  const wrapClass = [
    'relative overflow-hidden border-2 border-dashed border-zinc-600 bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-lw-rust transition',
    circle ? 'rounded-full' : 'rounded-xl',
    aspect,
  ].join(' ');

  return (
    <div>
      <p className="text-xs text-zinc-400 font-medium mb-2 uppercase tracking-wider">{label}</p>
      <div className={wrapClass} onClick={() => inputRef.current?.click()}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandKitPage() {
  const supabaseRef = useRef(createClient());
  const [userName, setUserName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm]         = useState<BrandForm>(EMPTY_FORM);

  // ── Load ──────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (user?.email) setUserName(user.email.split('@')[0]);

      const res  = await fetch('/api/realtor/brand-kit');
      const data = await res.json();
      if (data.brandKit) {
        const bk = data.brandKit;
        setForm({
          display_name:       bk.display_name       || '',
          job_title:          bk.job_title           || '',
          brokerage_name:     bk.brokerage_name      || '',
          license_number:     bk.license_number      || '',
          bio:                bk.bio                 || '',
          preferred_cta:      bk.preferred_cta       || '',
          disclaimer_text:    bk.disclaimer_text     || '',
          phone:              bk.phone               || '',
          email:              bk.email               || '',
          website:            bk.website             || '',
          primary_color:      bk.primary_color       || '#E8621A',
          secondary_color:    bk.secondary_color     || '#1a1a1a',
          accent_color:       bk.accent_color        || '#ffffff',
          headshot_url:       bk.headshot_url         || '',
          personal_logo_url:  bk.personal_logo_url   || '',
          brokerage_logo_url: bk.brokerage_logo_url  || '',
          cover_photo_url:    bk.cover_photo_url      || '',
          instagram_handle:   bk.instagram_handle    || '',
          facebook_url:       bk.facebook_url        || '',
          linkedin_url:       bk.linkedin_url        || '',
          youtube_url:        bk.youtube_url         || '',
        });
      }
    } catch (e) {
      console.error('[brand] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function set(key: keyof BrandForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setSaveError('');
    try {
      const res  = await fetch('/api/realtor/brand-kit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
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

  // ── Logout ────────────────────────────────────────────────────────────────────

  async function handleLogout() {
    try { await supabaseRef.current.auth.signOut({ scope: 'global' }); } catch {}
    window.location.href = '/login';
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout
        userName={userName || 'User'}
        pageTitle="MY BRAND KIT"
        navItems={NAV_ITEMS}
        activeNavId="my-brand"
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
      pageTitle="MY BRAND KIT"
      navItems={NAV_ITEMS}
      activeNavId="my-brand"
      onLogout={handleLogout}
    >
      <div className="p-6 max-w-3xl mx-auto pb-28 space-y-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div>
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            My Brand Kit
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your brand identity powers everything ListWorx generates for you.
          </p>
          <p className="text-xs text-gray-400 mt-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 inline-block">
            Fill in as much or as little as you'd like. The more you add, the more personalized your generated content becomes.
          </p>
        </div>

        {/* ── Banners ─────────────────────────────────────────────────────── */}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Brand kit saved.
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        {/* ── SECTION 1 — Identity ────────────────────────────────────────── */}
        <Section title="Identity">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display Name">
              <input
                className={inputCls}
                placeholder="Jane Smith"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
              />
            </Field>
            <Field label="Job Title">
              <input
                className={inputCls}
                placeholder="Realtor® | Listing Specialist"
                value={form.job_title}
                onChange={(e) => set('job_title', e.target.value)}
              />
            </Field>
            <Field label="Brokerage Name">
              <input
                className={inputCls}
                placeholder="Benchmark Realty"
                value={form.brokerage_name}
                onChange={(e) => set('brokerage_name', e.target.value)}
              />
            </Field>
            <Field label="License Number">
              <input
                className={inputCls}
                placeholder="TN 123456"
                value={form.license_number}
                onChange={(e) => set('license_number', e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="A short bio that appears in your generated emails and profile"
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Preferred CTA">
              <input
                className={inputCls}
                placeholder="Schedule a showing today"
                value={form.preferred_cta}
                onChange={(e) => set('preferred_cta', e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Disclaimer Text">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Equal Housing Opportunity. Licensed in TN."
                  value={form.disclaimer_text}
                  onChange={(e) => set('disclaimer_text', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ── SECTION 2 — Contact ─────────────────────────────────────────── */}
        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                className={inputCls}
                type="tel"
                placeholder="(615) 555-0100"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                placeholder="jane@brokerage.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
            <Field label="Website" hint="Include https://">
              <input
                className={inputCls}
                type="url"
                placeholder="https://janesmith.com"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── SECTION 3 — Brand Colors ─────────────────────────────────────── */}
        <Section title="Brand Colors">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <ColorPicker
              label="Primary"
              value={form.primary_color}
              onChange={(v) => set('primary_color', v)}
            />
            <ColorPicker
              label="Secondary"
              value={form.secondary_color}
              onChange={(v) => set('secondary_color', v)}
            />
            <ColorPicker
              label="Accent (optional)"
              value={form.accent_color}
              onChange={(v) => set('accent_color', v)}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-4">
            These colors will be used in your generated flyers, emails, and social posts.
          </p>
        </Section>

        {/* ── SECTION 4 — Media Uploads ────────────────────────────────────── */}
        <Section title="Media Uploads">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ImageUpload
              label="Headshot"
              url={form.headshot_url}
              field="headshot"
              aspect="w-full h-32"
              circle
              onUploaded={(url) => set('headshot_url', url)}
              onClear={() => set('headshot_url', '')}
            />
            <ImageUpload
              label="Personal Logo"
              url={form.personal_logo_url}
              field="personal_logo"
              aspect="w-full h-32"
              onUploaded={(url) => set('personal_logo_url', url)}
              onClear={() => set('personal_logo_url', '')}
            />
            <ImageUpload
              label="Brokerage Logo"
              url={form.brokerage_logo_url}
              field="brokerage_logo"
              aspect="w-full h-32"
              onUploaded={(url) => set('brokerage_logo_url', url)}
              onClear={() => set('brokerage_logo_url', '')}
            />
            <ImageUpload
              label="Cover Photo"
              url={form.cover_photo_url}
              field="cover"
              aspect="w-full h-32"
              onUploaded={(url) => set('cover_photo_url', url)}
              onClear={() => set('cover_photo_url', '')}
            />
          </div>
        </Section>

        {/* ── SECTION 5 — Social Links ─────────────────────────────────────── */}
        <Section title="Social Links">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instagram Handle">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="@janesmith"
                  value={form.instagram_handle}
                  onChange={(e) => set('instagram_handle', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Facebook URL">
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="https://facebook.com/..."
                  value={form.facebook_url}
                  onChange={(e) => set('facebook_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="LinkedIn URL">
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin_url}
                  onChange={(e) => set('linkedin_url', e.target.value)}
                />
              </div>
            </Field>
            <Field label="YouTube URL">
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  className={`${inputCls} pl-9`}
                  placeholder="https://youtube.com/@yourchannel"
                  value={form.youtube_url}
                  onChange={(e) => set('youtube_url', e.target.value)}
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Sticky save bar ──────────────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 md:left-60 z-40 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
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
              'Save Brand Kit'
            )}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
