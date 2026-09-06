'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader as Loader2, Camera, ArrowLeft, CheckCircle, XCircle, CalendarClock } from 'lucide-react';
import { resolveBaseTierId } from '@/lib/tiers-config';

interface Booking {
  id: string;
  media_partner_id: string;
  requester_type: string;
  source: string;
  status: string;
  property_address: string | null;
  preferred_date: string | null;
  notes: string;
  decline_reason: string | null;
  job_value: number | null;
  commission_owed: number | null;
  partner_payout: number | null;
  quarter: string | null;
  requested_at: string;
}

interface PartnerOpt {
  id: string;
  company_name: string;
}

function currentQuarter() {
  const d = new Date();
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

const SOURCE_LABEL: Record<string, string> = {
  dashboard: 'Contractor booking · commissioned',
  realtor_referral_pool: 'Realtor referral · no fee',
  elite_quarterly: 'Elite quarterly session',
};

export default function ContractorMediaPage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [incoming, setIncoming] = useState<Booking[]>([]);
  const [mine, setMine] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<PartnerOpt[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [jobValueDraft, setJobValueDraft] = useState<Record<string, string>>({});
  const [quarterlyPick, setQuarterlyPick] = useState('');
  const [quarterlyNotes, setQuarterlyNotes] = useState('');

  const load = async () => {
    const [{ bookings: inc }, { bookings: own }, mp] = await Promise.all([
      fetch('/api/media-bookings?as=partner').then((r) => r.json()),
      fetch('/api/media-bookings?as=requester').then((r) => r.json()),
      fetch('/api/media-partners').then((r) => r.json()),
    ]);
    setIncoming(Array.isArray(inc) ? inc : []);
    setMine(Array.isArray(own) ? own : []);
    setPartners(Array.isArray(mp?.partners) ? mp.partners : []);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/contractor-dashboard/media');
        return;
      }
      const { data: prof } = await supabase
        .from('contractor_profiles')
        .select('id, company_name, is_media_partner, subscription_tier, founder_tier')
        .eq('user_id', session.user.id)
        .maybeSingle();
      setProfile(prof);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isElite = useMemo(() => resolveBaseTierId(profile) === 'elite', [profile]);
  const thisQuarterClaim = mine.find(
    (b) => b.source === 'elite_quarterly' && b.quarter === currentQuarter(),
  );

  const act = async (id: string, action: string, extra: Record<string, any> = {}) => {
    setBusy(id + action);
    setErr('');
    try {
      const res = await fetch('/api/media-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Action failed.');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const claimQuarterly = async () => {
    if (!quarterlyPick) return;
    setBusy('claim');
    setErr('');
    try {
      const res = await fetch('/api/media-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_partner_id: quarterlyPick,
          elite_quarterly: true,
          notes: quarterlyNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Could not book the session.');
        return;
      }
      setQuarterlyPick('');
      setQuarterlyNotes('');
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
      </div>
    );
  }

  const StatusPill = ({ s }: { s: string }) => (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
        s === 'requested'
          ? 'border-amber-800/40 bg-amber-950/30 text-amber-400'
          : s === 'confirmed'
          ? 'border-sky-800/40 bg-sky-950/30 text-sky-400'
          : s === 'completed'
          ? 'border-emerald-800/40 bg-emerald-950/30 text-emerald-400'
          : 'border-zinc-700 bg-zinc-800/60 text-zinc-400'
      }`}
    >
      {s}
    </span>
  );

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/contractor-dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <Camera className="h-6 w-6 text-[#E8621A]" />
          <h1 className="text-2xl font-bold text-white">Listing Media</h1>
        </div>

        {err && (
          <div className="mb-6 rounded-lg border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-300">
            {err}
          </div>
        )}

        {/* Elite quarterly session */}
        {isElite && (
          <section className="mb-8 rounded-2xl border border-[#E8621A]/30 bg-[#E8621A]/[0.06] p-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#E8621A]" />
              <h2 className="text-lg font-bold text-white">
                Your {currentQuarter()} content session
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Elite includes one free video content session per quarter. ListWorx pays the media
              partner directly — no cost to you.
            </p>

            {thisQuarterClaim ? (
              <div className="mt-4 flex items-center gap-3">
                <StatusPill s={thisQuarterClaim.status} />
                <span className="text-sm text-zinc-300">
                  Booked{' '}
                  {new Date(thisQuarterClaim.requested_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {thisQuarterClaim.decline_reason ? ` — ${thisQuarterClaim.decline_reason}` : ''}
                </span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <select
                  value={quarterlyPick}
                  onChange={(e) => setQuarterlyPick(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">Choose a media partner…</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.company_name}
                    </option>
                  ))}
                </select>
                <Input
                  value={quarterlyNotes}
                  onChange={(e) => setQuarterlyNotes(e.target.value)}
                  placeholder="What do you want out of the session? (optional)"
                  className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                />
                <Button
                  onClick={claimQuarterly}
                  disabled={!quarterlyPick || busy === 'claim'}
                  className="bg-[#E8621A] text-white hover:bg-[#d45516]"
                >
                  {busy === 'claim' ? 'Booking…' : `Claim my ${currentQuarter()} session`}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Incoming requests (media partners only) */}
        {profile?.is_media_partner && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Requests to you ({incoming.length})
            </h2>
            {incoming.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
                No booking requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {incoming.map((b) => (
                  <div key={b.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill s={b.status} />
                      <span className="text-xs text-zinc-500">{SOURCE_LABEL[b.source] || b.source}</span>
                      <span className="ml-auto text-xs text-zinc-600">
                        {new Date(b.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                    {b.notes && <p className="mt-2 text-sm text-zinc-300">{b.notes}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-zinc-500">
                      {b.property_address && <span>{b.property_address}</span>}
                      {b.preferred_date && <span>Preferred: {b.preferred_date}</span>}
                      {b.status === 'completed' && b.source === 'dashboard' && (
                        <span className="text-zinc-300">
                          Job ${Number(b.job_value).toLocaleString()} · commission owed $
                          {Number(b.commission_owed || 0).toLocaleString()}
                        </span>
                      )}
                      {b.status === 'completed' && b.source === 'elite_quarterly' && b.partner_payout != null && (
                        <span className="text-zinc-300">
                          ListWorx pays you ${Number(b.partner_payout).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {b.status === 'requested' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => act(b.id, 'confirm')}
                          disabled={busy === b.id + 'confirm'}
                          className="bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => act(b.id, 'decline', { reason: 'Not available' })}
                          disabled={busy === b.id + 'decline'}
                          className="border-zinc-700 text-zinc-300"
                        >
                          <XCircle className="mr-1.5 h-4 w-4" /> Decline
                        </Button>
                      </div>
                    )}

                    {b.status === 'confirmed' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {b.source === 'dashboard' && (
                          <Input
                            type="number"
                            min={0}
                            placeholder="Final job value $"
                            value={jobValueDraft[b.id] || ''}
                            onChange={(e) =>
                              setJobValueDraft((d) => ({ ...d, [b.id]: e.target.value }))
                            }
                            className="h-9 w-40 border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                          />
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            act(b.id, 'complete', {
                              job_value:
                                b.source === 'dashboard'
                                  ? Number(jobValueDraft[b.id])
                                  : undefined,
                            })
                          }
                          disabled={
                            busy === b.id + 'complete' ||
                            (b.source === 'dashboard' && !Number(jobValueDraft[b.id]))
                          }
                          className="bg-[#E8621A] text-white hover:bg-[#d45516]"
                        >
                          Mark complete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* My own bookings */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Media partners you&apos;ve booked
            </h2>
            <Link href="/media-partners" className="text-sm text-[#E8621A] hover:underline">
              Browse media partners →
            </Link>
          </div>
          {mine.filter((b) => b.source !== 'elite_quarterly').length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
              You haven&apos;t booked any media partners yet.
            </p>
          ) : (
            <div className="space-y-3">
              {mine
                .filter((b) => b.source !== 'elite_quarterly')
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <StatusPill s={b.status} />
                    <span className="flex-1 truncate text-sm text-zinc-300">
                      {b.notes || 'Media booking'}
                    </span>
                    {['requested', 'confirmed'].includes(b.status) && (
                      <button
                        onClick={() => act(b.id, 'cancel')}
                        disabled={busy === b.id + 'cancel'}
                        className="text-xs text-zinc-500 hover:text-red-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
