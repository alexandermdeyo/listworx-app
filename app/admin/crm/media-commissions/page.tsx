'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import {
  ChevronLeft,
  LogOut,
  Loader as Loader2,
  CircleAlert as AlertCircle,
  Download,
} from 'lucide-react';

interface Row {
  media_partner_id: string;
  name: string;
  jobs: number;
  job_total: number;
  commission_total: number;
}

function monthOptions() {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    d.setUTCMonth(d.getUTCMonth() - 1);
  }
  return out;
}

export default function MediaCommissionsPage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [month, setMonth] = useState(monthOptions()[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const result = await checkAdminAuth();
      if (!result.ok) {
        if (result.reason === 'not_admin') setAccessDenied(true);
        else router.push('/login?redirect=/admin/crm/media-commissions');
        setLoading(false);
        return;
      }
      setLoading(false);
      void loadReport(month);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReport = async (m: string) => {
    setFetching(true);
    setError('');
    try {
      const res = await fetch(`/api/media-bookings?report=${m}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the report');
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e: any) {
      setError(e.message);
      setRows([]);
    } finally {
      setFetching(false);
    }
  };

  const exportCsv = () => {
    const header = ['Media partner', 'Completed jobs', 'Job value total', 'Commission owed'];
    const body = rows.map((r) => [r.name, r.jobs, r.job_total.toFixed(2), r.commission_total.toFixed(2)]);
    const csv = [header, ...body, ['TOTAL', totalJobs, totalJobValue.toFixed(2), totalCommission.toFixed(2)]]
      .map((r) => r.map((v) => `"${v}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `media-commissions-${month}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lw-dark">
        <Loader2 className="h-10 w-10 animate-spin text-lw-rust" />
      </div>
    );
  }
  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lw-dark">
        <div className="max-w-md rounded-2xl border border-lw-dark-border bg-lw-dark-card p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <Button onClick={() => signOut().then(() => router.push('/login'))} className="mt-4 bg-lw-rust text-white">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const totalJobs = rows.reduce((s, r) => s + r.jobs, 0);
  const totalJobValue = rows.reduce((s, r) => s + r.job_total, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission_total, 0);

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/crm">
              <Button variant="ghost" size="sm" className="px-2 text-zinc-400 hover:text-white">
                <ChevronLeft className="mr-1 h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <div className="h-5 w-px bg-lw-dark-border" />
            <div>
              <h1 className="text-2xl font-bold text-white">Media Commissions</h1>
              <p className="mt-0.5 text-sm text-zinc-400">
                Completed contractor-sourced media bookings — for manual invoicing to the media
                partner.
              </p>
            </div>
          </div>
          <Button onClick={() => signOut().then(() => router.push('/login'))} variant="outline" size="sm" className="border-lw-dark-border text-zinc-300">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              void loadReport(e.target.value);
            }}
            className="rounded-lg border border-lw-dark-border bg-lw-dark-card px-3 py-2 text-sm text-white"
          >
            {monthOptions().map((m) => (
              <option key={m} value={m}>
                {new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
          <Button
            onClick={exportCsv}
            disabled={rows.length === 0}
            variant="outline"
            size="sm"
            className="border-lw-dark-border text-zinc-300"
          >
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-lw-dark-border/60 bg-lw-dark-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-lw-dark-border/60 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Media partner</th>
                <th className="px-4 py-3 text-right">Jobs</th>
                <th className="px-4 py-3 text-right">Job value</th>
                <th className="px-4 py-3 text-right">Commission owed</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-lw-rust" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                    No completed contractor-sourced media bookings this month.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.media_partner_id} className="border-b border-lw-dark-border/40">
                    <td className="px-4 py-3 text-white">{r.name}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">{r.jobs}</td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      ${r.job_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-lw-rust">
                      ${r.commission_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="text-white">
                  <td className="px-4 py-3 font-bold">Total</td>
                  <td className="px-4 py-3 text-right font-bold">{totalJobs}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    ${totalJobValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-lw-rust">
                    ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
