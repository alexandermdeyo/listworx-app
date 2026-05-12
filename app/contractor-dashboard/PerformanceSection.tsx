'use client';

import { PARTNER_STATUS } from '@/lib/partner-status';
import { ContractorProfile } from './types';
import { TrendingUp, Users, CircleCheck as CheckCircle2, Clock, ChartBar as BarChart3, Lock, ArrowUpRight, Activity } from 'lucide-react';

interface PerformanceData {
  totalLeads: number;
  leadsThisMonth: number;
  leadsLast30Days: number;
  acceptedLeads: number;
  declinedLeads: number;
  completedJobs: number;
}

interface PerformanceSectionProps {
  profile: ContractorProfile;
  performanceData: PerformanceData;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-white text-gray-900 rounded-xl border border-lw-border-light p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lw-text/50 text-xs font-medium uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-lw-text mt-1.5">{value}</p>
          {sublabel && <p className="text-lw-text/40 text-xs mt-0.5">{sublabel}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-lw-surface border border-lw-border-light">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function PerformanceSection({
  profile,
  performanceData,
}: PerformanceSectionProps) {
  const isActive = profile.partner_status === PARTNER_STATUS.ACTIVE;
  const conversionRate =
    performanceData.totalLeads > 0
      ? Math.round((performanceData.acceptedLeads / performanceData.totalLeads) * 100)
      : 0;
  const acceptanceRate =
    performanceData.totalLeads > 0
      ? Math.round(
          ((performanceData.acceptedLeads + performanceData.declinedLeads > 0
            ? performanceData.acceptedLeads /
              (performanceData.acceptedLeads + performanceData.declinedLeads)
            : 0) *
            100)
        )
      : 0;

  if (!isActive) {
    return (
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-lw-text">Performance Analytics</h2>
            <p className="text-lw-text/50 text-sm mt-0.5">
              Track your referrals, leads, and conversion metrics
            </p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-lw-border-light bg-white text-gray-900 overflow-hidden shadow-sm">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/70 text-gray-900 z-10 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 rounded-full bg-lw-surface border border-lw-border-light mb-4">
              <Lock className="h-6 w-6 text-lw-text/40" />
            </div>
            <h3 className="text-lw-text font-bold text-lg mb-2">
              Unlock Performance Analytics
            </h3>
            <p className="text-lw-text/60 text-sm max-w-xs">
              Activate a subscription to access your full performance dashboard including
              leads, referrals, and conversion metrics.
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-30 pointer-events-none select-none">
            <MetricCard label="Total Leads" value="—" icon={Users} color="text-blue-500" />
            <MetricCard label="This Month" value="—" icon={TrendingUp} color="text-emerald-500" />
            <MetricCard label="Accepted" value="—" icon={CheckCircle2} color="text-green-500" />
            <MetricCard label="Conversion" value="—%" icon={BarChart3} color="text-amber-500" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-lw-text">Performance Analytics</h2>
          <p className="text-lw-text/50 text-sm mt-0.5">
            Your referral and lead performance overview
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full">
          <Activity className="h-3 w-3" />
          Live
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <MetricCard
          label="Total Leads"
          value={performanceData.totalLeads}
          icon={Users}
          color="text-blue-500"
          sublabel="All time"
        />
        <MetricCard
          label="This Month"
          value={performanceData.leadsThisMonth}
          icon={TrendingUp}
          color="text-emerald-500"
          sublabel="Current month"
        />
        <MetricCard
          label="Accepted"
          value={performanceData.acceptedLeads}
          icon={CheckCircle2}
          color="text-green-500"
          sublabel={`${acceptanceRate}% acceptance`}
        />
        <MetricCard
          label="Conversion"
          value={`${conversionRate}%`}
          icon={BarChart3}
          color="text-amber-500"
          sublabel="Lead to job rate"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white text-gray-900 rounded-xl border border-lw-border-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lw-text/50 text-xs font-medium uppercase tracking-wide">
              Lead Activity
            </p>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">Last 30 days</span>
              <span className="text-lw-text font-semibold">{performanceData.leadsLast30Days}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">Completed jobs</span>
              <span className="text-lw-text font-semibold">{performanceData.completedJobs}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">Declined</span>
              <span className="text-lw-text font-semibold">{performanceData.declinedLeads}</span>
            </div>
          </div>
        </div>

        <div className="bg-white text-gray-900 rounded-xl border border-lw-border-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lw-text/50 text-xs font-medium uppercase tracking-wide">
              Response Standards
            </p>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">Response goal</span>
              <span className="text-blue-600 font-semibold">2 hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">IronClad standard</span>
              <span className="text-emerald-600 font-semibold">24 hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-lw-text/70">Current tier</span>
              <span className="text-lw-text font-semibold capitalize">{profile.tier}</span>
            </div>
          </div>
        </div>

        <div className="bg-white text-gray-900 rounded-xl border border-lw-border-light p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lw-text/50 text-xs font-medium uppercase tracking-wide">
              Tips for Growth
            </p>
            <TrendingUp className="h-4 w-4 text-lw-rust" />
          </div>
          <ul className="space-y-1.5">
            {[
              'Respond within 2 hours',
              'Keep profile updated',
              'Request client reviews',
              'Maintain certifications',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-lw-text/60">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
