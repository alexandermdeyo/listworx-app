'use client';

import { useState } from 'react';
import { Users, UserCheck, Clock, DollarSign, TrendingUp, Percent, Copy, CircleCheck as CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import {
  DEMO_ACES_OVERVIEW_STATS,
  DEMO_ACES_MONTHLY_REFERRALS,
  DEMO_ACES_REFERRAL_LINK,
  DEMO_ACES_PROMO_CODE,
} from '@/lib/demo/acesDemoData';

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-orange-50">
          <Icon className="h-4 w-4 text-lw-rust" />
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const stats = DEMO_ACES_OVERVIEW_STATS;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${DEMO_ACES_REFERRAL_LINK}`);
      setCopied(true);
      toast({ title: 'Copied', description: 'Referral link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Demo Mode', description: 'Copy is unavailable in this preview environment.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Total Referred Contractors" value={stats.totalReferredContractors.toLocaleString()} icon={Users} />
        <KpiCard label="Active Subscribers" value={stats.activeSubscribers.toLocaleString()} icon={UserCheck} />
        <KpiCard label="Pending Applications" value={stats.pendingApplications.toLocaleString()} icon={Clock} />
        <KpiCard label="Est. Monthly Commission" value={`$${stats.estMonthlyCommission.toLocaleString()}`} icon={DollarSign} />
        <KpiCard label="Lifetime Commission" value={`$${stats.lifetimeCommission.toLocaleString()}`} icon={TrendingUp} />
        <KpiCard label="Conversion Rate" value={`${stats.conversionRatePercent}%`} icon={Percent} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Referred Contractors by Month</h3>
        <p className="text-xs text-gray-500 mb-4">New contractor referrals attributed to ACES over the last 6 months.</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_ACES_MONTHLY_REFERRALS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: 'rgba(232,98,26,0.08)' }}
                contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 13 }}
              />
              <Bar dataKey="count" name="Referrals" fill="#E8621A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Your Referral Link</h3>
        <p className="text-xs text-gray-500 mb-4">Share this link with your students to track referrals.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <span className="text-sm font-mono text-gray-700 truncate">{DEMO_ACES_REFERRAL_LINK}</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-lw-rust px-4 py-2.5 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors"
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Promo Code</span>
          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-orange-50 text-lw-rust">{DEMO_ACES_PROMO_CODE}</span>
        </div>
      </div>
    </div>
  );
}
