'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Inbox, Phone } from 'lucide-react';

/**
 * How many times ListWorx has referred this contractor, by period.
 * Owner rule (2026-11-12): contractors see only these counts — never the job
 * or the requestor. The numbers come from my_referral_tally(), which returns
 * counts only; contractors cannot read referral rows.
 */
type Tally = {
  this_week: number;
  this_month: number;
  this_quarter: number;
  this_year: number;
  all_time: number;
};

const PERIODS: { key: keyof Tally; label: string }[] = [
  { key: 'this_week', label: 'This week' },
  { key: 'this_month', label: 'This month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'this_year', label: 'This year' },
  { key: 'all_time', label: 'All time' },
];

export default function ReferralTally() {
  const [tally, setTally] = useState<Tally | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc('my_referral_tally')
      .then(({ data, error }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
          console.error('Error loading referral counts:', error);
          setFailed(true);
          return;
        }
        setTally({
          this_week: Number(row.this_week) || 0,
          this_month: Number(row.this_month) || 0,
          this_quarter: Number(row.this_quarter) || 0,
          this_year: Number(row.this_year) || 0,
          all_time: Number(row.all_time) || 0,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="referrals">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-lw-text">Your Referrals</h2>
        <p className="text-lw-text/50 text-sm mt-0.5">
          How many times ListWorx has referred you to a homeowner or property professional.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {PERIODS.map(({ key, label }) => (
          <div
            key={key}
            className="bg-white text-gray-900 rounded-xl border border-lw-border-light p-4 shadow-sm"
          >
            <p className="text-lw-text/50 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-lw-text mt-1.5">
              {tally ? tally[key] : failed ? '—' : '…'}
            </p>
          </div>
        ))}
      </div>

      {failed && (
        <p className="mt-3 text-sm text-red-600">
          Your referral counts could not be loaded. Please refresh the page.
        </p>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-lw-border-light bg-lw-surface p-4 text-sm text-lw-text/70">
        <Phone className="h-4 w-4 mt-0.5 shrink-0 text-lw-text/50" />
        <p>
          When you are referred, the homeowner or property professional receives your business name
          and contact details and may contact you directly. Be ready for a possible call, text, or
          email. You will get an email each time you are referred.
        </p>
      </div>

      {tally && tally.all_time === 0 && (
        <div className="mt-3 flex items-start gap-3 text-sm text-lw-text/50">
          <Inbox className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            No referrals yet. Referral volume grows as the network grows in your area — keep your
            profile, trades and service counties up to date.
          </p>
        </div>
      )}
    </section>
  );
}
