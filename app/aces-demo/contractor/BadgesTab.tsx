'use client';

import { Shield, Award, Briefcase, GraduationCap, HardHat, Star, Crown, Lock } from 'lucide-react';
import { DEMO_BADGES, type DemoBadge, type DemoTierId } from '@/lib/demo/acesDemoData';

const ICONS: Record<DemoBadge['icon'], React.ElementType> = {
  shield: Shield,
  award: Award,
  briefcase: Briefcase,
  graduation: GraduationCap,
  hardhat: HardHat,
  star: Star,
  crown: Crown,
};

export default function BadgesTab({ tier }: { tier: DemoTierId }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Badges</h2>
        <p className="text-sm text-gray-500">Credentials Cumberland Valley Roofing has earned on ListWorx.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_BADGES.map((badge) => {
          const Icon = ICONS[badge.icon];
          const unlocked = !badge.unlockedForTiers || badge.unlockedForTiers.includes(tier);

          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-5 shadow-sm flex flex-col items-center text-center ${
                badge.featured ? 'border-2 border-lw-rust bg-orange-50' : 'border-gray-200 bg-white'
              } ${!unlocked ? 'opacity-50' : ''}`}
            >
              <div
                className={`h-14 w-14 rounded-full flex items-center justify-center mb-3 ${
                  unlocked ? 'bg-orange-100' : 'bg-gray-100'
                }`}
              >
                {unlocked ? <Icon className="h-7 w-7 text-lw-rust" /> : <Lock className="h-6 w-6 text-gray-400" />}
              </div>
              <h3 className="text-sm font-bold text-gray-900">{badge.label}</h3>
              {badge.featured && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-lw-rust mt-1">Featured</span>
              )}
              <p className="text-xs text-gray-500 mt-2">{badge.description}</p>
              {!unlocked && (
                <p className="text-xs font-semibold text-gray-400 mt-2">Unlocks at Elite Partner</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
