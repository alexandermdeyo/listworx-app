'use client';

import { Button } from '@/components/ui/button';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { ContractorProfile } from './types';
import {
  Sparkles,
  MapPin,
  Star,
  Zap,
  Lock,
  ArrowRight,
  BadgeCheck,
  Megaphone,
} from 'lucide-react';

interface MarketingOpportunity {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  eligible: boolean;
  previewOnly: boolean;
  actionLabel: string;
  actionType: 'upgrade' | 'email' | 'preview';
  tierId?: 'basic' | 'preferred' | 'elite';
  addOnId?: 'featured_spotlight' | 'ironclad_badge_kit';
}

interface MarketingSectionProps {
  profile: ContractorProfile;
  onCheckout: (tierId: string, isAnnual: boolean) => void;
  checkoutLoading: string | null;
}

export default function MarketingSection({
  profile,
  onCheckout,
  checkoutLoading,
}: MarketingSectionProps) {
  const isActive = profile.partner_status === PARTNER_STATUS.ACTIVE;
  const isApproved =
    profile.partner_status === PARTNER_STATUS.APPROVED ||
    profile.partner_status === PARTNER_STATUS.ACTIVE;
  const isPreferred = profile.tier === 'preferred' || profile.tier === 'elite';
  const isElite = profile.tier === 'elite';

  const opportunities: MarketingOpportunity[] = [
    {
      id: 'territory-lock',
      icon: MapPin,
      title: 'Territory Lock',
      description:
        'Secure limited territory exclusivity in your service area. This offer is currently handled manually while the automation is being finalized.',
      value: 'Limited slots and added visibility',
      badge: 'Manual Setup',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      eligible: isApproved && isPreferred,
      previewOnly: !isApproved || !isPreferred,
      actionLabel: isPreferred ? 'Contact to Add' : 'Upgrade to Preferred',
      actionType: isPreferred ? 'email' : 'upgrade',
      tierId: 'preferred',
    },
    {
      id: 'spotlight',
      icon: Star,
      title: 'Featured Spotlight',
      description:
        'Get featured placement inside the ListWorx platform, putting your business at the top of relevant searches and contractor listings.',
      value: 'Platform-wide featured visibility',
      badge: 'Available',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      eligible: isApproved && isElite,
      previewOnly: !isApproved || !isElite,
      actionLabel: isElite ? 'Request Spotlight' : 'Upgrade to Elite',
      actionType: isElite ? 'email' : 'upgrade',
      tierId: 'elite',
      addOnId: 'featured_spotlight',
    },
    {
      id: 'holiday-boost',
      icon: Megaphone,
      title: 'Holiday Promotion Boost',
      description:
        'Get featured during high-demand seasonal periods like spring prep, summer service demand, fall maintenance, and holiday cleanup.',
      value: 'Increased visibility during peak seasons',
      badge: 'Seasonal',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      eligible: isActive,
      previewOnly: !isActive,
      actionLabel: 'Learn More',
      actionType: 'email',
    },
    {
      id: 'ironclad-badge',
      icon: BadgeCheck,
      title: 'IronClad Badge Kit',
      description:
        'Get a physical and digital IronClad badge kit including signage, decals, and branded materials to showcase your certification.',
      value: 'Physical certification branding materials',
      badge: 'Available Now',
      badgeColor: 'bg-lw-rust/10 text-lw-rust border-lw-rust/20',
      eligible: isActive,
      previewOnly: !isActive,
      actionLabel: 'Order Badge Kit',
      actionType: 'email',
      addOnId: 'ironclad_badge_kit',
    },
    {
      id: 'upgrade-preferred',
      icon: Zap,
      title: 'Upgrade to Preferred',
      description:
        'Get priority placement, enhanced profile visibility, and stronger lead routing priority.',
      value: 'More visibility and better lead priority',
      badge: 'Recommended',
      badgeColor: 'bg-lw-rust/10 text-lw-rust border-lw-rust/20',
      eligible: isApproved && profile.tier === 'basic',
      previewOnly: false,
      actionLabel: 'Upgrade — $349/mo',
      actionType: 'upgrade',
      tierId: 'preferred',
    },
    {
      id: 'upgrade-elite',
      icon: Sparkles,
      title: 'Upgrade to Elite',
      description:
        'Top placement in searches, strongest profile visibility, and the highest visibility tier in the platform.',
      value: 'Maximum visibility and positioning',
      badge: 'Top Tier',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      eligible: isApproved && (profile.tier === 'basic' || profile.tier === 'preferred'),
      previewOnly: false,
      actionLabel: 'Upgrade — $599/mo',
      actionType: 'upgrade',
      tierId: 'elite',
    },
  ];

  const visibleOpportunities = opportunities.filter(
    (opportunity) => opportunity.eligible || opportunity.previewOnly
  );

  function handleOpportunityClick(opportunity: MarketingOpportunity) {
    if (opportunity.actionType === 'upgrade' && opportunity.tierId) {
      onCheckout(opportunity.tierId, false);
      return;
    }

    const subject = encodeURIComponent(`ListWorx: ${opportunity.title}`);
    const body = encodeURIComponent(
      `Hi Alex,\n\nI want more information about: ${opportunity.title}\n\nBusiness name: ${profile.company_name || ''}\nTier: ${profile.tier || ''}\n\nThanks.`
    );

    window.location.href = `mailto:adeyo@listworx.co?subject=${subject}&body=${body}`;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-lw-text">Marketing Opportunities</h2>
          <p className="text-lw-text/50 text-sm mt-0.5">
            Add-ons, upgrades, and promotions available for your account
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleOpportunities.map((opportunity) => {
          const Icon = opportunity.icon;

          return (
            <div
              key={opportunity.id}
              className={`relative rounded-xl border bg-white p-5 text-gray-900 flex flex-col transition-all shadow-sm ${
                opportunity.previewOnly
                  ? 'border-lw-border-light opacity-60'
                  : 'border-lw-border-light hover:border-lw-rust/30 hover:shadow-md'
              }`}
            >
              {opportunity.previewOnly && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs text-lw-text/40 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Preview
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-lw-surface border border-lw-border-light flex-shrink-0">
                  <Icon className="h-4 w-4 text-lw-text/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lw-text text-sm">{opportunity.title}</h3>
                    {opportunity.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${opportunity.badgeColor}`}
                      >
                        {opportunity.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-lw-text/60 text-xs leading-relaxed mb-3 flex-1">
                {opportunity.description}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-4">
                <Sparkles className="h-3 w-3" />
                {opportunity.value}
              </div>

              {opportunity.eligible ? (
                <Button
                  size="sm"
                  className="w-full bg-orange-600 text-white hover:bg-orange-700 text-xs"
                  onClick={() => handleOpportunityClick(opportunity)}
                  disabled={!!checkoutLoading}
                >
                  {opportunity.actionLabel}
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled
                  className="w-full bg-gray-100 text-gray-400 border border-gray-300 text-xs cursor-not-allowed"
                >
                  <Lock className="h-3 w-3 mr-1.5" />
                  {opportunity.actionLabel}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
