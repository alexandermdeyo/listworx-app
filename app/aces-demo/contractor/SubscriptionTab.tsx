'use client';

import { CircleCheck as CheckCircle, Circle as CircleIcon, Shield, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEMO_TIERS, type DemoTierId } from '@/lib/demo/acesDemoData';

const TIER_ICONS: Record<DemoTierId, React.ElementType> = {
  basic: Shield,
  preferred: Zap,
  elite: Crown,
};

export default function SubscriptionTab({
  tier,
  onSelectTier,
}: {
  tier: DemoTierId;
  onSelectTier: (tier: DemoTierId) => void;
}) {
  const { toast } = useToast();

  function handleSelect(t: DemoTierId) {
    onSelectTier(t);
    toast({
      title: 'Demo Mode',
      description: `Switched to ${DEMO_TIERS.find((d) => d.id === t)?.name} — no real subscription change was made.`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Subscription</h2>
        <p className="text-sm text-gray-500">
          Cumberland Valley Roofing is a Founding Partner — rate locked for life at the price shown below.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {DEMO_TIERS.map((t) => {
          const Icon = TIER_ICONS[t.id];
          const isCurrent = t.id === tier;

          return (
            <div
              key={t.id}
              className={`rounded-2xl border-2 bg-white p-6 flex flex-col ${
                isCurrent ? 'border-lw-rust shadow-md' : 'border-gray-200 shadow-sm'
              }`}
            >
              {isCurrent && (
                <span className="self-start mb-3 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#E8621A' }}>
                  Current Plan
                </span>
              )}

              <div className="p-2.5 rounded-lg bg-orange-50 w-fit mb-3">
                <Icon className="h-5 w-5 text-lw-rust" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">{t.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${t.founderMonthlyPrice}</span>
                <span className="text-sm text-gray-500">/mo</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="line-through">${t.monthlyPrice}/mo standard</span> — locked as Founding Partner
                </p>
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {t.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <CircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(t.id)}
                disabled={isCurrent}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-lw-rust text-white hover:bg-lw-rust-hover'
                }`}
              >
                {isCurrent ? 'Current Plan' : `Switch to ${t.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">Demo mode — no Stripe checkout runs here. Switching tiers only changes what this preview shows.</p>
    </div>
  );
}
