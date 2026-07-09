'use client';

import { TrendingUp, Users, CircleCheck as CheckCircle2, Clock, ChartBar as BarChart3, Lock, GraduationCap } from 'lucide-react';
import {
  ACES_PARTNER,
  ACES_PARTNER_ID,
  DEMO_PERFORMANCE_DATA,
  DEMO_PROFILE_COMPLETION_PERCENT,
  DEMO_ACADEMY_PROGRESS_PERCENT,
  DEMO_TIERS,
  getDemoReferralsForContractor,
  getDemoJobRequestById,
  type DemoTierId,
} from '@/lib/demo/acesDemoData';

function ProgressBar({ value }: { value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-lw-rust transition-all" style={{ width: `${bounded}%` }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sublabel?: string;
}) {
  return (
    <div className="bg-white text-gray-900 rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1.5">{value}</p>
          {sublabel && <p className="text-gray-400 text-xs mt-0.5">{sublabel}</p>}
        </div>
        <div className="p-2 rounded-lg bg-orange-50">
          <Icon className="h-5 w-5 text-lw-rust" />
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab({ tier }: { tier: DemoTierId }) {
  const tierConfig = DEMO_TIERS.find((t) => t.id === tier)!;
  const perf = DEMO_PERFORMANCE_DATA;
  const referrals = getDemoReferralsForContractor(ACES_PARTNER_ID)
    .map((r) => ({ referral: r, job: getDemoJobRequestById(r.job_request_id)! }))
    .sort((a, b) => new Date(b.referral.created_at).getTime() - new Date(a.referral.created_at).getTime())
    .slice(0, 3);

  const hasPerformanceReport = tier === 'preferred' || tier === 'elite';

  return (
    <div className="space-y-6">
      {/* Plan badge */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-lw-rust mb-1">Current Plan</p>
          <h2 className="text-xl font-bold text-gray-900">{tierConfig.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{ACES_PARTNER.company_name} — Founding Partner</p>
        </div>
        <span className="px-4 py-1.5 text-sm font-bold rounded-full text-white self-start" style={{ backgroundColor: '#E8621A' }}>
          {tierConfig.badge || tierConfig.name.replace(' Partner', '')}
        </span>
      </div>

      {/* Profile completion + Academy progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Profile Completion</p>
            <span className="text-sm font-bold text-lw-rust">{DEMO_PROFILE_COMPLETION_PERCENT}%</span>
          </div>
          <ProgressBar value={DEMO_PROFILE_COMPLETION_PERCENT} />
          <p className="text-xs text-gray-400 mt-2">Add a profile video to reach 100%.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-lw-rust" />
              ListWorx Academy Progress
            </p>
            <span className="text-sm font-bold text-lw-rust">{DEMO_ACADEMY_PROGRESS_PERCENT}%</span>
          </div>
          <ProgressBar value={DEMO_ACADEMY_PROGRESS_PERCENT} />
          <p className="text-xs text-gray-400 mt-2">Contractor License Prep — 2 of 4 modules complete.</p>
        </div>
      </div>

      {/* Referral activity summary */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Referral Activity</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Total Referrals" value={perf.totalReferrals} icon={Users} />
          <MetricCard label="This Month" value={perf.referralsThisMonth} icon={TrendingUp} sublabel={`${perf.referralsLast30Days} in last 30 days`} />
          <MetricCard label="Completed Jobs" value={perf.completedJobs} icon={CheckCircle2} />
        </div>
      </div>

      {/* Performance report — tier gated */}
      {!hasPerformanceReport && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm opacity-70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Monthly Performance Report</p>
              <p className="text-xs text-gray-500">Upgrade to Preferred or Elite to unlock branded monthly PDF reports.</p>
            </div>
            <button className="text-xs font-semibold border border-gray-300 bg-white text-gray-400 rounded-lg px-3 py-1.5 cursor-not-allowed">
              Not Available
            </button>
          </div>
        </div>
      )}

      {/* Recent matched requests */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Recent Matched Requests</h3>
        <div className="space-y-3">
          {referrals.map(({ referral, job }) => (
            <div key={referral.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{job.job_description}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(job.created_at).toLocaleDateString()} · {job.property_county} County
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                {referral.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-lw-rust/20 bg-orange-50 p-4 flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-lw-rust flex-shrink-0" />
        <p className="text-sm text-gray-700">This is a demo dashboard populated with sample data — nothing here is connected to real ListWorx accounts.</p>
      </div>
    </div>
  );
}
