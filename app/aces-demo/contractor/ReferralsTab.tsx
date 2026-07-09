'use client';

import { Briefcase, MapPin, Clock, DollarSign, Phone, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  ACES_PARTNER_ID,
  DEMO_CATEGORIES,
  getDemoReferralsForContractor,
  getDemoJobRequestById,
} from '@/lib/demo/acesDemoData';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  HIRED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function categoryName(id: string) {
  return DEMO_CATEGORIES.find((c) => c.id === id)?.name || 'General Services';
}

export default function ReferralsTab() {
  const { toast } = useToast();
  const referrals = getDemoReferralsForContractor(ACES_PARTNER_ID)
    .map((r) => ({ referral: r, job: getDemoJobRequestById(r.job_request_id)! }))
    .sort((a, b) => new Date(b.referral.created_at).getTime() - new Date(a.referral.created_at).getTime());

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This is a visual-only demo — no message was sent.' });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Referrals</h2>
        <p className="text-sm text-gray-500">Requests matched to Cumberland Valley Roofing through the ListWorx rotation.</p>
      </div>

      {referrals.map(({ referral, job }) => (
        <div key={referral.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-lw-rust" />
                {categoryName(job.categories[0])}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{job.requester_name} · {job.requester_type}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[referral.status]}`}>
              {referral.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-4">{job.job_description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="h-3.5 w-3.5 text-gray-400" /> {job.property_county} County, {job.property_state}
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <DollarSign className="h-3.5 w-3.5 text-gray-400" /> {job.budget_range}
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="h-3.5 w-3.5 text-gray-400" /> {job.urgency.replace('_', ' ')}
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              Match #{referral.slot_position}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={showDemoToast}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-lw-rust px-4 py-2 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors"
            >
              <Phone className="h-3.5 w-3.5" /> Contact
            </button>
            <button
              onClick={showDemoToast}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Request
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
