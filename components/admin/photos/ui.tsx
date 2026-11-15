'use client';

import { useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';

export const RUST = '#E8621A';
// "!" because the site-wide input rule in globals.css sets a pale border with higher specificity.
export const inputCls =
  'w-full rounded-md border !border-gray-500 bg-white px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-500 focus:!border-[#E8621A] focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30';
export const labelCls = 'block text-sm font-semibold text-gray-900 mb-1';
export const helpCls = 'mt-1 text-xs text-gray-600';

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${props.className || ''}`} style={{ backgroundColor: RUST }} />;
}
export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md border border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 ${props.className || ''}`} />;
}
export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 ${props.className || ''}`} />;
}

export const PHOTO_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-900 border-amber-300',
  approved: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  rejected: 'bg-red-50 text-red-800 border-red-300',
};

export function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function fmtBytes(n: number) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

/** Signed-in admin requests (adds the session token) plus the browser Supabase client. */
export function useAdminApi() {
  const supabase = useMemo(() => createClient(), []);
  const api = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}`, ...(init?.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(json.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }, [supabase]);
  return { api, supabase };
}

export type ArticleRef = { id: string; title: string; slug: string; status: string; published: boolean };

export type LibraryPhoto = {
  id: string; storage_bucket: string; storage_path: string; public_url: string | null; public_path: string | null;
  public_copy_live: boolean; preview_url: string | null; used_in?: ArticleRef[]; original_filename: string; mime_type: string; file_size: number;
  width: number; height: number; sha256: string; dhash: string | null; title: string | null; description: string | null;
  alt_text: string | null; category: string | null; tags: string[]; intended_uses: string[]; source: string | null;
  usage_rights: string; rights_notes: string | null; is_ai_generated: boolean; quality_flags: string[];
  focus_x: number | null; focus_y: number | null; status: 'pending' | 'approved' | 'rejected'; review_note: string | null;
  review_checklist: Record<string, boolean>; reviewed_by: string | null; reviewed_at: string | null; archived: boolean;
  import_batch: string | null; external_ref: string | null; created_at: string; updated_at: string;
  duplicates?: { exact: string[]; similar: { id: string; distance: number }[] };
  warnings?: { level: 'block' | 'warn' | 'info'; code: string; text: string }[];
};
