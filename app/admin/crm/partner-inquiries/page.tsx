'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CircleAlert as AlertCircle,
  Loader as Loader2,
  LogOut,
  Trash2,
  ChevronLeft,
  Inbox,
  Mail,
  Phone,
  Check,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

type Kind = 'supplier' | 'brokerage';
type Status = 'new' | 'contacted' | 'archived';

interface Inquiry {
  id: string;
  kind: Kind;
  org_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  details: string;
  status: Status;
  created_at: string;
}

const KIND_LABEL: Record<Kind, string> = { supplier: 'Supplier', brokerage: 'Brokerage' };

export default function PartnerInquiriesAdminPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [token, setToken] = useState('');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [error, setError] = useState('');

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
        router.push('/login?redirect=/admin/crm/partner-inquiries');
      }
      setLoading(false);
      return;
    }
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token || '';
    setToken(accessToken);
    setIsAuthenticated(true);
    await load(accessToken);
    setLoading(false);
  };

  const load = async (t = token) => {
    try {
      const res = await fetch('/api/partner-inquiry?all=true', { headers: authHeader(t) });
      if (!res.ok) throw new Error('Could not load inquiries');
      const data = await res.json();
      setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const setStatus = async (id: string, status: Status) => {
    try {
      const res = await fetch('/api/partner-inquiry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      const updated = await res.json();
      setInquiries((prev) => prev.map((q) => (q.id === id ? updated : q)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this inquiry permanently?')) return;
    try {
      const res = await fetch(`/api/partner-inquiry?id=${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
      setInquiries((prev) => prev.filter((q) => q.id !== id));
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

  const shown = inquiries.filter((q) => filter === 'all' || q.kind === filter);
  const newCount = inquiries.filter((q) => q.status === 'new').length;

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/crm">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white px-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div className="w-px h-5 bg-lw-dark-border" />
            <div>
              <h1 className="text-2xl font-bold text-white">Partner Inquiries</h1>
              <p className="text-zinc-400 text-sm mt-0.5">
                Submissions from the Supplier and Brokerage partner pages.
              </p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-xs underline">
              dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: inquiries.length, color: 'text-zinc-300' },
            { label: 'New', value: newCount, color: 'text-lw-rust' },
            {
              label: 'Suppliers / Brokerages',
              value: `${inquiries.filter((q) => q.kind === 'supplier').length} / ${inquiries.filter((q) => q.kind === 'brokerage').length}`,
              color: 'text-zinc-300',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-lw-dark-border/50 bg-lw-dark-card p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex gap-2">
          {(['all', 'supplier', 'brokerage'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                filter === f
                  ? 'border-lw-rust bg-lw-rust/15 text-lw-rust'
                  : 'border-lw-dark-border text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No inquiries yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((q) => (
              <div
                key={q.id}
                className={`rounded-2xl border bg-lw-dark-card p-5 transition-all ${
                  q.status === 'archived' ? 'border-lw-dark/40 opacity-60' : 'border-lw-dark-border/50'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800/60 text-zinc-300">
                    {KIND_LABEL[q.kind]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
                      q.status === 'new'
                        ? 'bg-lw-rust/10 text-lw-rust border-lw-rust/40'
                        : q.status === 'contacted'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : 'bg-zinc-800/60 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {q.status}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">
                    {new Date(q.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-semibold text-white">{q.org_name}</h3>
                <p className="text-sm text-zinc-400">{q.contact_name}</p>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-lw-rust">
                    <Mail className="h-3.5 w-3.5" /> {q.email}
                  </a>
                  {q.phone && (
                    <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-lw-rust">
                      <Phone className="h-3.5 w-3.5" /> {q.phone}
                    </a>
                  )}
                </div>

                {q.details && (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-lw-dark-surface/60 p-3 text-sm text-zinc-300">
                    {q.details}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {q.status !== 'contacted' && (
                    <button
                      onClick={() => setStatus(q.id, 'contacted')}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-300 hover:text-white transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" /> Mark contacted
                    </button>
                  )}
                  {q.status !== 'archived' ? (
                    <button
                      onClick={() => setStatus(q.id, 'archived')}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-300 hover:text-white transition-colors"
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(q.id, 'new')}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-300 hover:text-white transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reopen
                    </button>
                  )}
                  <button
                    onClick={() => remove(q.id)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-lw-dark-surface text-zinc-500 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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
