'use client';

import { DEMO_TIERS, type DemoTierId } from '@/lib/demo/acesDemoData';

export default function TierSwitcher({
  tier,
  onSelectTier,
}: {
  tier: DemoTierId;
  onSelectTier: (tier: DemoTierId) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
      {DEMO_TIERS.map((t) => {
        const isActive = t.id === tier;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTier(t.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              isActive ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
            style={isActive ? { backgroundColor: '#E8621A' } : {}}
          >
            {t.name.replace(' Partner', '')}
          </button>
        );
      })}
    </div>
  );
}
