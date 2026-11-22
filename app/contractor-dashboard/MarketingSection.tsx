'use client';

import { Button } from '@/components/ui/button';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { ADDON_LIST, isAddonPurchaseDisabled } from '@/lib/tiers-config';
import { ContractorProfile } from './types';
import {
  Sparkles,
  MapPin,
  Star,
  Zap,
  Lock,
  ArrowRight,
  BadgeCheck,
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
  addOnId?: string;
}

interface MarketingSectionProps {
  profile: ContractorProfile;
  onCheckout: (tierId: string, isAnnual: boolean) => void;
  checkoutLoading: string | null;
}

export default function MarketingSection({
  profile,
  checkoutLoading,
}: MarketingSectionProps) {
  const isActive = profile.partner_status === PARTNER_STATUS.ACTIVE;
  const isApproved =
    profile.partner_status === PARTNER_STATUS.APPROVED ||
    profile.partner_status === PARTNER_STATUS.ACTIVE;
  const canUpgradeMembership = isActive && profile.archived !== true;

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
      eligible: isActive,
      previewOnly: !isActive,
      actionLabel: 'Contact to Add',
      actionType: 'email',
    },
    {
      id: 'spotlight',
      icon: Star,
      title: 'Featured Spotlight',
      description:
        'Get featured placement inside the ListWorx platform, putting your business at the top of relevant searches and contractor listings.',
      value: 'Platform-wide featured visibility',
      eligible: isActive,
      previewOnly: !isActive,
      actionLabel: 'Request Spotlight',
      actionType: 'email',
      addOnId: 'featured_spotlight',
    },
    {
      id: 'ironclad-badge',
      icon: BadgeCheck,
      title: 'IronClad Badge Kit',
      description:
        'Get a physical and digital IronClad badge kit including signage, decals, and branded materials to showcase your certification.',
      value: 'Physical certification branding materials',
      eligible: isActive,
      previewOnly: !isActive,
      actionLabel: 'Order Badge Kit',
      actionType: 'email',
      addOnId: 'ironclad_badge_kit',
    },
    {
      id: 'membership-growth',
      icon: Zap,
      title: 'Growth Membership',
      description:
        'Business manuals, templates, marketing resources, and 5% off ListWorx Media Services. Every membership gets equal referral consideration.',
      value: '$199/month',
      badge: 'Membership',
      badgeColor: 'bg-lw-rust/10 text-lw-rust border-lw-rust/20',
      eligible: canUpgradeMembership,
      previewOnly: false,
      actionLabel: 'View Growth',
      actionType: 'upgrade',
    },
    {
      id: 'membership-business-pro',
      icon: Sparkles,
      title: 'Business Pro Membership',
      description:
        'Everything in Growth, plus 2 custom social posts a month, the full Flyer Builder, and 10% off ListWorx Media Services. Every membership gets equal referral consideration.',
      value: '$299/month',
      badge: 'Membership',
      badgeColor: 'bg-lw-rust/10 text-lw-rust border-lw-rust/20',
      eligible: canUpgradeMembership,
      previewOnly: false,
      actionLabel: 'View Business Pro',
      actionType: 'upgrade',
    },
  ];

  const hardcodedAddonIds = new Set(['featured_spotlight', 'ironclad_badge_kit']);

  const tierCheck = (includedIn: string[]) => {
    if (!profile.tier) return false;
    return includedIn.includes(profile.tier);
  };

  const additionalAddons: MarketingOpportunity[] = ADDON_LIST
    .filter((addon) => !hardcodedAddonIds.has(addon.id))
    .map((addon) => {
      const includedInTier = addon.includedIn && tierCheck(addon.includedIn as string[]);
      const priceLabel =
        addon.type === 'onetime'
          ? `$${addon.price} one-time`
          : `$${addon.price}/month`;
      return {
        id: `addon-${addon.id}`,
        icon: Sparkles,
        title: addon.name,
        description: addon.description,
        value: priceLabel,
        badge: includedInTier ? 'Included with your plan' : 'Available add-on',
        badgeColor: includedInTier
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-lw-rust/10 text-lw-rust border-lw-rust/20',
        eligible: isActive && !includedInTier,
        previewOnly: !isActive,
        actionLabel: includedInTier ? 'Included' : 'Contact to Purchase',
        actionType: 'email' as const,
      };
    });

  // Add-ons whose purchase is switched off (price mismatch or no working
  // delivery) stay visible but can't be requested until the offer is fixed.
  const addonIdOf = (o: MarketingOpportunity) =>
    o.addOnId || (o.id.startsWith('addon-') ? o.id.slice('addon-'.length) : o.id === 'territory-lock' ? 'territory_lock' : '');
  const visibleOpportunities = [...opportunities, ...additionalAddons]
    .map((o) =>
      isAddonPurchaseDisabled(addonIdOf(o)) && o.actionType !== 'upgrade'
        ? {
            ...o,
            eligible: false,
            previewOnly: true,
            badge: 'Temporarily unavailable',
            badgeColor: 'bg-zinc-800 text-zinc-400 border-zinc-700',
            actionLabel: 'Temporarily unavailable',
          }
        : o
    )
    .filter((opportunity) => opportunity.eligible || opportunity.previewOnly);

  function handleOpportunityClick(opportunity: MarketingOpportunity) {
    // Membership changes happen on /billing, which knows the current plan.
    if (opportunity.actionType === 'upgrade') {
      window.location.href = '/billing';
      return;
    }

    const subject = encodeURIComponent(`ListWorx: ${opportunity.title}`);
    const body = encodeURIComponent(
      `Hi Alex,\n\nI want more information about: ${opportunity.title}\n\nBusiness name: ${profile.company_name || ''}\nMembership status: ${profile.partner_status || ''}\n\nThanks.`
    );

    window.location.href = `mailto:adeyo@listworx.co?subject=${subject}&body=${body}`;
  }

  return (
    <div className="rounded-2xl border-2 border-lw-rust bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Marketing Opportunities</h2>
          <p className="text-zinc-400 text-sm mt-0.5">
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
              className={`relative rounded-xl border bg-zinc-900/60 p-5 text-white flex flex-col transition-all shadow-sm ${
                opportunity.previewOnly
                  ? 'border-zinc-700 opacity-60'
                  : 'border-zinc-700 hover:border-lw-rust/50 hover:shadow-md'
              }`}
            >
              {opportunity.previewOnly && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Preview
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 flex-shrink-0">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white text-sm">{opportunity.title}</h3>
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

              <p className="text-zinc-400 text-xs referraling-relaxed mb-3 flex-1">
                {opportunity.description}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-4">
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
                  className="w-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs cursor-not-allowed"
                >
                  <Lock className="h-3 w-3 mr-1.5" />
                  {opportunity.actionLabel}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
