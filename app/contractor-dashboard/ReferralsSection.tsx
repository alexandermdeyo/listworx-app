'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Inbox,
} from 'lucide-react';

interface Referral {
  id: string;
  job_request_id: string;
  slot_position: number;
  tier_at_referral: string;
  status: string;
  email_sent: boolean;
  created_at: string;
  job_requests: {
    requester_type: string;
    property_county: string;
    property_state: string;
    job_description: string;
    urgency: string;
    job_request_categories: Array<{
      categories: { name: string };
    }>;
  } | null;
}

interface ReferralsSectionProps {
  contractorProfileId: string;
}

export default function ReferralsSection({ contractorProfileId }: ReferralsSectionProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractorProfileId) return;
    void loadReferrals();
  }, [contractorProfileId]);

  async function loadReferrals() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          job_request_id,
          slot_position,
          tier_at_referral,
          status,
          email_sent,
          created_at,
          job_requests (
            requester_type,
            property_county,
            property_state,
            job_description,
            urgency,
            job_request_categories (
              categories ( name )
            )
          )
        `)
        .eq('contractor_id', contractorProfileId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading referrals:', error);
      } else {
        setReferrals((data as any) || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    SENT: { label: 'Notified', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    VIEWED: { label: 'Viewed', color: 'text-sky-700 bg-sky-50 border-sky-200' },
    CONTACTED: { label: 'Client Contacted You', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    CLOSED: { label: 'Closed', color: 'text-lw-text/50 bg-lw-surface border-lw-border-light' },
    EXPIRED: { label: 'Expired', color: 'text-lw-text/40 bg-lw-surface border-lw-border-light' },
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-lw-border-light bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-lw-text">Your Referrals</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-lw-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="rounded-2xl border border-lw-border-light bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-lw-text">Your Referrals</h3>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Inbox className="h-10 w-10 text-lw-text/20" />
          <p className="text-sm font-medium text-lw-text/50">No referrals yet</p>
          <p className="max-w-xs text-xs text-lw-text/40">
            No referrals yet this month. As the network grows in your area, referral volume increases. Make sure your profile is complete and your IronClad status is active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-lw-border-light bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-bold text-lw-text">Your Referrals</h3>
        <span className="rounded-full bg-lw-rust/10 px-2.5 py-0.5 text-xs font-semibold text-lw-rust">
          {referrals.length} total
        </span>
      </div>

      <div className="space-y-3">
        {referrals.map(referral => {
          const job = referral.job_requests;
          const categories = job?.job_request_categories
            ?.map((jrc: any) => jrc.categories?.name)
            .filter(Boolean) || [];
          const location = [job?.property_county ? `${job.property_county} County` : null, job?.property_state]
            .filter(Boolean)
            .join(', ');
          const status = statusLabel[referral.status] || statusLabel['PENDING'];
          const receivedAt = new Date(referral.created_at);

          return (
            <div
              key={referral.id}
              className="rounded-xl border border-lw-border-light bg-lw-surface p-4 transition-colors hover:bg-lw-surface"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {categories.length > 0 ? (
                    categories.map((cat: string) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 rounded-full border border-lw-rust/20 bg-lw-rust/10 px-2.5 py-0.5 text-xs font-medium text-lw-rust"
                      >
                        <Briefcase className="h-3 w-3" />
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-lw-border-light bg-white px-2.5 py-0.5 text-xs font-medium text-lw-text/50">
                      <Briefcase className="h-3 w-3" />
                      General Services
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-lw-text/50">
                {location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {location}
                  </span>
                )}
                {job?.requester_type && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {job.requester_type}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  {receivedAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {receivedAt.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {job?.job_description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-lw-text/40">
                  {job.job_description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
