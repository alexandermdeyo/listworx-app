'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronDown, ChevronRight, ExternalLink, FileText, Home, Image as ImageIcon, LayoutDashboard, Loader as Loader2, MonitorCog, Settings, Trash2, Upload, Users, Clock, Copy, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';

type ContentType = 'text' | 'richtext' | 'image_url' | 'video_url' | 'boolean' | 'json' | 'color';
type SiteContentRow = {
  id: string;
  page: string;
  section_key: string;
  section_label: string;
  content_type: ContentType;
  value: string | null;
  is_visible: boolean;
  display_order: number;
};
type GroupedContent = Record<string, SiteContentRow[]>;
type SaveStatus = Record<string, 'saved' | 'error' | 'saving' | undefined>;
type Testimonial = { name: string; trade: string; city: string; quote: string };
type MediaFile = { name: string; id?: string; updated_at?: string; created_at?: string; metadata?: { mimetype?: string; size?: number }; url: string };

const tabs = [
  { id: 'home', label: 'Homepage' },
  { id: 'founding_partner', label: 'Founding Partner Page' },
  { id: 'pricing', label: 'Pricing Page' },
  { id: 'global', label: 'Global Settings' },
];

const groups: Record<string, { title: string; visibleKey?: string; prefixes: string[] }[]> = {
  home: [
    { title: 'Hero Section', visibleKey: 'hero_visible', prefixes: ['hero_'] },
    { title: "Why We're Different", visibleKey: 'why_visible', prefixes: ['why_'] },
    { title: 'Founding Partner Banner', visibleKey: 'founder_banner_visible', prefixes: ['founder_banner_'] },
    { title: 'IronClad Standards', visibleKey: 'ironclad_visible', prefixes: ['ironclad_'] },
    { title: 'Testimonials', visibleKey: 'testimonials_visible', prefixes: ['testimonials_'] },
    { title: 'Final CTA', visibleKey: 'final_cta_visible', prefixes: ['final_cta_'] },
  ],
  founding_partner: [{ title: 'Founding Partner Page', visibleKey: 'fp_visible', prefixes: ['fp_'] }],
  pricing: [{ title: 'Pricing Page', visibleKey: 'pricing_banner_visible', prefixes: ['pricing_'] }],
  global: [{ title: 'Global Settings', prefixes: ['company_', 'footer_'] }],
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function formatBytes(size?: number) {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTestimonials(value: string | null): Testimonial[] {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 6).map(item => ({ name: item.name || '', trade: item.trade || '', city: item.city || '', quote: item.quote || '' }));
  } catch (_e) {
    return [];
  }
}

function videoEmbedUrl(url: string) {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default function SiteEditorPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [content, setContent] = useState({} as GroupedContent);
  const [drafts, setDrafts] = useState({} as Record<string, string>);
  const [statuses, setStatuses] = useState({} as SaveStatus);
  const [openGroups, setOpenGroups] = useState({} as Record<string, boolean>);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([] as MediaFile[]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');

  useEffect(() => { void checkAuth(); }, []);

  const adminNavItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm' },
    { id: 'site-editor', label: 'Site Editor', icon: MonitorCog, href: '/admin/crm/site-editor' },
    { id: 'contractors', label: 'Contractors', icon: Users, href: '/admin/crm/contractors' },
    { id: 'applications', label: 'Applications', icon: Clock, href: '/admin/crm/applications' },
    { id: 'job-requests', label: 'Job Requests', icon: FileText, href: '/admin/crm/job-requests' },
    { id: 'realtors', label: 'Realtors', icon: Home, href: '/admin/crm/realtors' },
    { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
  ], []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') { setAccessDenied(true); setLoading(false); }
      else router.push('/login?redirect=/admin/crm/site-editor');
      return;
    }
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || '';
    setToken(accessToken);
    setIsAuthenticated(true);
    await loadContent(accessToken);
    setLoading(false);
  };

  const loadContent = async (accessToken = token) => {
    const res = await fetch('/api/admin/site-content', { headers: authHeader(accessToken) });
    if (!res.ok) throw new Error('Could not load site content');
    const data = await res.json();
    setContent(data);
    const nextDrafts: Record<string, string> = {};
    Object.values(data as GroupedContent).flat().forEach(row => { nextDrafts[row.id] = row.value || ''; });
    setDrafts(nextDrafts);
    setOpenGroups(prev => Object.keys(prev).length ? prev : { 'home:Hero Section': true, 'founding_partner:Founding Partner Page': true, 'pricing:Pricing Page': true, 'global:Global Settings': true });
  };

  const patchRow = async (row: SiteContentRow, updates: { value?: string; is_visible?: boolean }) => {
    setStatuses(prev => ({ ...prev, [row.id]: 'saving' }));
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader(token) },
        body: JSON.stringify({ page: row.page, section_key: row.section_key, ...updates }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setContent(prev => ({ ...prev, [row.page]: (prev[row.page] || []).map(item => item.id === row.id ? updated : item) }));
      if (updates.value !== undefined) setDrafts(prev => ({ ...prev, [row.id]: updates.value || '' }));
      setStatuses(prev => ({ ...prev, [row.id]: 'saved' }));
      setTimeout(() => setStatuses(prev => ({ ...prev, [row.id]: undefined })), 2000);
    } catch (_e) {
      setStatuses(prev => ({ ...prev, [row.id]: 'error' }));
    }
  };

  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch('/api/admin/site-content/upload', { headers: authHeader(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load media');
      setMediaFiles(data.files || []);
    } catch (_e) {
      setMediaFiles([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const uploadFile = async (row: SiteContentRow, file: File) => {
    setUploadingKey(row.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/site-content/upload', { method: 'POST', headers: authHeader(token), body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await patchRow(row, { value: data.url });
      await loadMedia();
    } catch (_e) {
      setStatuses(prev => ({ ...prev, [row.id]: 'error' }));
    } finally {
      setUploadingKey('');
    }
  };

  const deleteMedia = async (name: string) => {
    if (!confirm('Delete this uploaded file?')) return;
    const res = await fetch(`/api/admin/site-content/upload?path=${encodeURIComponent(name)}`, { method: 'DELETE', headers: authHeader(token) });
    if (res.ok) await loadMedia();
  };

  const rowsForGroup = (page: string, group: { prefixes: string[] }) => (content[page] || []).filter(row => group.prefixes.some(prefix => row.section_key.startsWith(prefix)));
  const getVisibleRow = (page: string, key?: string) => key ? (content[page] || []).find(row => row.section_key === key) : undefined;

  const renderStatus = (row: SiteContentRow) => {
    const status = statuses[row.id];
    if (status === 'saving') return <span className="text-xs text-gray-500">Saving...</span>;
    if (status === 'saved') return <span className="text-xs text-emerald-600">Saved ✓</span>;
    if (status === 'error') return <span className="text-xs text-red-600">Save failed — try again</span>;
    return null;
  };

  const renderEditor = (row: SiteContentRow) => {
    const draft = drafts[row.id] ?? row.value ?? '';
    if (row.content_type === 'boolean') {
      return (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div><p className="font-medium text-gray-900">{row.section_label}</p><p className={row.is_visible ? 'text-sm text-emerald-600' : 'text-sm text-gray-500'}>{row.is_visible ? 'Visible' : 'Hidden'}</p></div>
          <button onClick={() => patchRow(row, { is_visible: !row.is_visible, value: String(!row.is_visible) })} className={`h-7 w-12 rounded-full p-1 transition-colors ${row.is_visible ? 'bg-emerald-500' : 'bg-gray-300'}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${row.is_visible ? 'translate-x-5' : ''}`} /></button>
        </div>
      );
    }
    if (row.content_type === 'richtext') {
      return <FieldShell row={row} status={renderStatus(row)}><textarea value={draft} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} rows={Math.max(4, draft.split('\n').length + 1)} className="w-full rounded-lg border border-gray-300 p-3 text-sm" /><Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save</Button></FieldShell>;
    }
    if (row.content_type === 'image_url') {
      return <FieldShell row={row} status={renderStatus(row)}><div className="grid md:grid-cols-2 gap-3"><label className="rounded-lg border border-dashed border-gray-300 p-4 text-center cursor-pointer"><Upload className="mx-auto mb-2 h-5 w-5" />{uploadingKey === row.id ? 'Uploading...' : 'Upload Image'}<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(row, e.target.files[0])} /></label><div className="space-y-2"><input value={draft} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} placeholder="Or paste URL" className="w-full rounded-lg border border-gray-300 p-2 text-sm" /><Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save URL</Button></div></div>{draft && <div className="mt-3 flex items-center gap-3"><img src={draft} alt="Preview" className="h-24 w-32 rounded-lg object-cover border" /><Button size="sm" variant="outline" onClick={() => patchRow(row, { value: '' })}>Remove</Button></div>}</FieldShell>;
    }
    if (row.content_type === 'video_url') {
      const embed = videoEmbedUrl(draft);
      return <FieldShell row={row} status={renderStatus(row)}><div className="grid md:grid-cols-2 gap-3"><label className="rounded-lg border border-dashed border-gray-300 p-4 text-center cursor-pointer"><Video className="mx-auto mb-2 h-5 w-5" />{uploadingKey === row.id ? 'Uploading...' : 'Upload Video'}<input type="file" accept="video/mp4,video/webm" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(row, e.target.files[0])} /></label><div className="space-y-2"><input value={draft} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} placeholder="Or paste URL" className="w-full rounded-lg border border-gray-300 p-2 text-sm" /><Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save URL</Button></div></div>{draft && <div className="mt-3">{embed ? <iframe src={embed} className="aspect-video w-full max-w-lg rounded-lg border" /> : <video src={draft} controls className="max-h-64 rounded-lg border" />}<Button size="sm" variant="outline" className="mt-2" onClick={() => patchRow(row, { value: '' })}>Remove</Button></div>}</FieldShell>;
    }
    if (row.content_type === 'color') {
      return <FieldShell row={row} status={renderStatus(row)}><div className="flex flex-wrap items-center gap-3"><input type="color" value={draft || '#000000'} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} className="h-10 w-16" /><input value={draft} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} className="rounded-lg border border-gray-300 p-2 text-sm" /><span className="h-8 w-8 rounded-full border" style={{ backgroundColor: draft }} /><Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save</Button></div></FieldShell>;
    }
    if (row.content_type === 'json' && row.section_key === 'testimonials_json') {
      const testimonials = parseTestimonials(draft);
      const updateTestimonial = (index: number, key: keyof Testimonial, value: string) => {
        const next = testimonials.map((item, i) => i === index ? { ...item, [key]: value } : item);
        setDrafts(prev => ({ ...prev, [row.id]: JSON.stringify(next) }));
      };
      return <FieldShell row={row} status={renderStatus(row)}><div className="space-y-4">{testimonials.map((item, index) => <div key={index} className="rounded-lg border border-gray-200 p-4"><div className="grid md:grid-cols-3 gap-3"><input value={item.name} onChange={e => updateTestimonial(index, 'name', e.target.value)} placeholder="Name" className="rounded-lg border p-2 text-sm" /><input value={item.trade} onChange={e => updateTestimonial(index, 'trade', e.target.value)} placeholder="Trade" className="rounded-lg border p-2 text-sm" /><input value={item.city} onChange={e => updateTestimonial(index, 'city', e.target.value)} placeholder="City" className="rounded-lg border p-2 text-sm" /></div><textarea value={item.quote} onChange={e => updateTestimonial(index, 'quote', e.target.value)} placeholder="Quote" rows={3} className="mt-3 w-full rounded-lg border p-2 text-sm" /><Button size="sm" variant="outline" onClick={() => setDrafts(prev => ({ ...prev, [row.id]: JSON.stringify(testimonials.filter((_, i) => i !== index)) }))}>Delete</Button></div>)}<div className="flex gap-3"><Button size="sm" variant="outline" disabled={testimonials.length >= 6} onClick={() => setDrafts(prev => ({ ...prev, [row.id]: JSON.stringify([...testimonials, { name: '', trade: '', city: '', quote: '' }]) }))}>Add Testimonial</Button><Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save Testimonials</Button></div></div></FieldShell>;
    }
    return <FieldShell row={row} status={renderStatus(row)}><input value={draft} onChange={e => setDrafts(prev => ({ ...prev, [row.id]: e.target.value }))} className="w-full rounded-lg border border-gray-300 p-2 text-sm" />{draft.length > 100 && <p className="text-xs text-gray-500">{draft.length} characters</p>}<Button size="sm" onClick={() => patchRow(row, { value: draft })}>Save</Button></FieldShell>;
  };

  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  if (accessDenied) return <AccessState title="Access Denied" text="Admin privileges required." />;
  if (loading || !isAuthenticated) return <AccessState title="Loading Site Editor..." text="Checking admin permissions." loading />;

  return (
    <DashboardLayout userName="Admin" pageTitle="SITE EDITOR" navItems={adminNavItems} activeNavId="site-editor" onLogout={handleSignOut}>
      <div className="p-6 max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Site Editor</h1><p className="text-gray-500">Control what appears on the public-facing pages. Changes go live immediately.</p></div><a href="https://listworx.co" target="_blank" rel="noreferrer"><Button variant="outline">Preview Site <ExternalLink className="ml-2 h-4 w-4" /></Button></a></div>
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertCircle className="mr-2 inline h-4 w-4" />Changes are live instantly. Preview each page after saving to confirm it looks correct.</div>
        <div className="mb-6 flex flex-wrap gap-2">{tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'bg-lw-rust text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>)}</div>

        <div className="space-y-4">
          {(groups[activeTab] || []).map(group => {
            const key = `${activeTab}:${group.title}`;
            const visibleRow = getVisibleRow(activeTab, group.visibleKey);
            const expanded = openGroups[key] !== false;
            return (
              <div key={key} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-4">
                  <button className="flex items-center gap-2 font-semibold text-gray-900" onClick={() => setOpenGroups(prev => ({ ...prev, [key]: !expanded }))}>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{group.title}<span className={`rounded-full px-2 py-0.5 text-xs ${!visibleRow || visibleRow.is_visible ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{!visibleRow || visibleRow.is_visible ? 'Visible' : 'Hidden'}</span></button>
                  {visibleRow && <button onClick={() => patchRow(visibleRow, { is_visible: !visibleRow.is_visible, value: String(!visibleRow.is_visible) })} className={`h-7 w-12 rounded-full p-1 transition-colors ${visibleRow.is_visible ? 'bg-emerald-500' : 'bg-gray-300'}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${visibleRow.is_visible ? 'translate-x-5' : ''}`} /></button>}
                </div>
                {expanded && <div className="space-y-4 p-4">{rowsForGroup(activeTab, group).map(row => <div key={row.id}>{renderEditor(row)}</div>)}</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <button onClick={() => { setMediaOpen(!mediaOpen); if (!mediaOpen) void loadMedia(); }} className="flex w-full items-center justify-between p-4 font-semibold text-gray-900"><span className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Media Library</span>{mediaOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          {mediaOpen && <div className="border-t border-gray-100 p-4">{mediaLoading ? <Loader2 className="h-6 w-6 animate-spin text-lw-rust" /> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{mediaFiles.map(file => <div key={file.name} className="rounded-lg border border-gray-200 p-3"><div className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded bg-gray-100">{file.metadata?.mimetype?.startsWith('image/') ? <img src={file.url} alt={file.name} className="h-full w-full object-cover" /> : <Video className="h-8 w-8 text-gray-400" />}</div><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-gray-500">{file.metadata?.mimetype || 'File'} • {formatBytes(file.metadata?.size)}</p><p className="text-xs text-gray-400">{file.created_at ? new Date(file.created_at).toLocaleDateString() : ''}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(file.url)}><Copy className="h-3 w-3" /></Button><Button size="sm" variant="outline" onClick={() => deleteMedia(file.name)}><Trash2 className="h-3 w-3" /></Button></div></div>)}</div>}</div>}
        </div>
      </div>
    </DashboardLayout>
  );
}

function FieldShell({ row, status, children }: { row: SiteContentRow; status: ReactNode; children: ReactNode }) {
  return <div className="rounded-lg border border-gray-200 p-4"><div className="mb-2 flex items-center justify-between gap-3"><label className="font-medium text-gray-900">{row.section_label}</label>{status}</div><div className="space-y-2">{children}</div></div>;
}

function AccessState({ title, text, loading = false }: { title: string; text: string; loading?: boolean }) {
  return <div className="flex min-h-screen items-center justify-center bg-white"><div className="text-center">{loading ? <Loader2 className="h-10 w-10 animate-spin text-lw-rust mx-auto mb-3" /> : <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />}<h2 className="text-xl font-bold text-gray-900">{title}</h2><p className="text-gray-500">{text}</p></div></div>;
}
