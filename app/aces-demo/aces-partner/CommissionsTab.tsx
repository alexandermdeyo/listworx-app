'use client';

import { CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { DEMO_ACES_MONTHLY_COMMISSIONS, DEMO_ACES_LIFETIME_STATS } from '@/lib/demo/acesDemoData';

const STATUS_STYLES: Record<string, string> = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-800',
};

export default function CommissionsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Commissions</h2>
        <p className="text-sm text-gray-500">Monthly payout history based on active subscriber revenue at a 10% commission rate.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Active Subscribers</th>
              <th className="px-4 py-3 text-right">Gross Revenue</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Est. Payout</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACES_MONTHLY_COMMISSIONS.map((row) => (
              <tr key={row.month} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.month}</td>
                <td className="px-4 py-3 text-right text-gray-700">{row.activeSubscribers}</td>
                <td className="px-4 py-3 text-right text-gray-700">${row.grossRevenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-500">{(row.commissionRate * 100).toFixed(0)}%</td>
                <td className="px-4 py-3 text-right font-semibold text-lw-rust">${row.estimatedPayout.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[row.status]}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="p-2 rounded-lg bg-orange-50 w-fit mb-2">
            <TrendingUp className="h-4 w-4 text-lw-rust" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Lifetime Earnings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${DEMO_ACES_LIFETIME_STATS.totalLifetimeEarnings.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="p-2 rounded-lg bg-orange-50 w-fit mb-2">
            <Calendar className="h-4 w-4 text-lw-rust" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Next Payout Date</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{DEMO_ACES_LIFETIME_STATS.nextPayoutDate}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="p-2 rounded-lg bg-orange-50 w-fit mb-2">
            <CreditCard className="h-4 w-4 text-lw-rust" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment Method</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{DEMO_ACES_LIFETIME_STATS.paymentMethod}</p>
        </div>
      </div>
    </div>
  );
}
