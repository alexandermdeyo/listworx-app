'use client';

import { useEffect, useState } from 'react';
import { Images, Loader2, Search, X } from 'lucide-react';
import { PHOTO_USES, PHOTO_USE_LABELS, FEATURED_MIN_WIDTH } from '@/lib/photos/library';
import { SecondaryButton, inputCls, useAdminApi, type LibraryPhoto } from './ui';

/**
 * Choose an APPROVED photo from the library (used by the Content and Blog editors).
 * Only approved, active photos with a live public copy are offered; pending, rejected
 * and archived photos never appear (publishing also re-checks this on the server).
 */
export default function PhotoPicker({
  open, onClose, onSelect, defaultUse = 'blog_featured', title = 'Choose a photo',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (p: LibraryPhoto & { public_url: string }) => void;
  defaultUse?: string;
  title?: string;
}) {
  const { api } = useAdminApi();
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [q, setQ] = useState('');
  const [use, setUse] = useState(defaultUse);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<LibraryPhoto | null>(null);

  // Each time the picker opens, start from the use it was opened for (featured vs inline).
  useEffect(() => {
    if (open) {
      setUse(defaultUse);
      setPreview(null);
    }
  }, [open, defaultUse]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ publishable: '1', q, use });
    const t = setTimeout(() => {
      api(`/api/admin/photos?${params}`)
        .then((j) => setPhotos(j.photos))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, q, use, api]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} data-testid="photo-picker">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <p className="flex items-center gap-2 text-base font-semibold"><Images className="h-5 w-5" /> {title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input aria-label="Search approved photos" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search approved photos…" />
          </div>
          <select aria-label="Intended use" className={inputCls} value={use} onChange={(e) => setUse(e.target.value)}>
            <option value="">Any use</option>
            {PHOTO_USES.map((u) => <option key={u} value={u}>{PHOTO_USE_LABELS[u]}</option>)}
          </select>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            {error && <p className="text-sm text-red-800">{error}</p>}
            {loading ? <div className="flex items-center gap-2 text-gray-800"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
              : photos.length === 0 ? <p className="text-sm text-gray-800">No approved photos match. Photos must be approved in the Photo Library before they can be used.</p>
              : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => setPreview(p)} className={`block w-full overflow-hidden rounded-md border text-left ${preview?.id === p.id ? 'border-[#E8621A] ring-2 ring-[#E8621A]/40' : 'border-gray-300'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.public_url || ''} alt={p.alt_text || ''} loading="lazy" className="aspect-[4/3] w-full object-cover" style={{ objectPosition: `${p.focus_x ?? 50}% ${p.focus_y ?? 30}%` }} />
                        <span className="block truncate px-2 py-1 text-xs">{p.title || p.original_filename}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
          <div>
            {preview ? (
              <div className="space-y-2" data-testid="picker-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.public_url || ''} alt={preview.alt_text || ''} className="max-h-72 w-full rounded-md border border-gray-300 bg-gray-100 object-contain" />
                <p className="text-sm font-semibold">{preview.title || preview.original_filename}</p>
                <p className="text-sm text-gray-800">{preview.width}×{preview.height}{preview.is_ai_generated ? ' · AI-generated (approved after review)' : ''}</p>
                <p className="text-sm text-gray-800"><strong>Alt text:</strong> {preview.alt_text}</p>
                {preview.width < FEATURED_MIN_WIDTH && use === 'blog_featured' && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-950">Narrower than {FEATURED_MIN_WIDTH}px: may look soft as a featured photo.</p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { if (preview.public_url) { onSelect(preview as LibraryPhoto & { public_url: string }); onClose(); } }} className="rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: '#E8621A' }} data-testid="picker-use">
                    Use this photo
                  </button>
                  <SecondaryButton type="button" onClick={() => setPreview(null)}>Back</SecondaryButton>
                </div>
              </div>
            ) : <p className="text-sm text-gray-700">Click a photo to preview it.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
