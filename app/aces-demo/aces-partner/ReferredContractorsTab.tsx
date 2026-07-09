'use client';

import { useToast } from '@/hooks/use-toast';
import { DEMO_ACES_REFERRED_CONTRACTORS, getAcesEstCommission, type DemoTierId } from '@/lib/demo/acesDemoData';

const PLAN_LABELS: Record<DemoTierId, string> = { basic: 'Basic', preferred: 'Preferred', elite: 'Elite' };
const PLAN_STYLES: Record<DemoTierId, string> = {
  basic: 'bg-gray-100 text-gray-700',
  preferred: 'bg-blue-100 text-blue-700',
  elite: 'bg-orange-100 text-lw-rust',
};
const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-800',
  Applied: 'bg-gray-100 text-gray-600',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReferredContractorsTab() {
  const { toast } = useToast();

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This would open the contractor profile in the real dashboard.' });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Referred Contractors</h2>
        <p className="text-sm text-gray-500">A sample of contractors referred through your partnership with ListWorx.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signup Date</th>
              <th className="px-4 py-3 text-right">Monthly Sub.</th>
              <th className="px-4 py-3 text-right">Est. Commission</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACES_REFERRED_CONTRACTORS.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.companyName}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.ownerName}</td>
                <td className="px-4 py-3">
                  {row.plan ? (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PLAN_STYLES[row.plan]}`}>{PLAN_LABELS[row.plan]}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[row.status]}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.signupDate)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-medium whitespace-nowrap">
                  {row.monthlySubscription > 0 ? `$${row.monthlySubscription}/mo` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-lw-rust font-semibold whitespace-nowrap">
                  {row.monthlySubscription > 0 ? `$${getAcesEstCommission(row).toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={showDemoToast}
                    className="text-xs font-semibold text-lw-rust hover:underline whitespace-nowrap"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
