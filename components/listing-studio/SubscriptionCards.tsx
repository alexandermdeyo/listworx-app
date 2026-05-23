'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Zap } from 'lucide-react';

export type RealtorProfile = {
  id: string;
  user_id: string;
  realtor_plan: string | null;
  realtor_plan_interval: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  content_packages_remaining: number;
  flyers_remaining: number;
  landing_pages_remaining: number;
  slideshow_videos_remaining: number;
  purchased_content_packages: number;
  purchased_flyers: number;
  purchased_landing_pages: number;
  purchased_slideshow_videos: number;
  realtor_founder: boolean | null;
  realtor_founder_tier: string | null;
};

type BillingPeriod = 'monthly' | 'annual';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 59,
    annualPrice: 39,
    savingsPct: 34,
    highlight: false,
    highlightLabel: null as string | null,
    features: [
      '5 active listings',
      '8 content packages/month',
      '5 flyers/month',
      '5 landing pages/month',
      'AI captions, posts & email copy',
    ],
  },
  {
    id: 'agent',
    name: 'Agent',
    monthlyPrice: 119,
    annualPrice: 79,
    savingsPct: 34,
    highlight: true,
    highlightLabel: 'Most Popular' as string | null,
    features: [
      '15 active listings',
      '25 content packages/month',
      '15 flyers/month',
      '15 landing pages/month',
      'Everything in Starter',
      'Agent branding on all content',
    ],
  },
  {
    id: 'pro_agent',
    name: 'Pro Agent',
    monthlyPrice: 199,
    annualPrice: 139,
    savingsPct: 30,
    highlight: false,
    highlightLabel: null as string | null,
    features: [
      'Unlimited listings',
      '60 content packages/month',
      '40 flyers/month',
      '40 landing pages/month',
      '5 slideshow videos/month',
      'Everything in Agent',
      'Priority support',
    ],
  },
] as const;

// Monthly allocation limits per plan (used as fallback for usage bars)
const PLAN_LIMITS: Record<string, { content: number; flyers: number; landing: number; videos: number }> = {
  starter:   { content: 8,  flyers: 5,  landing: 5,  videos: 0 },
  agent:     { content: 25, flyers: 15, landing: 15, videos: 0 },
  pro_agent: { content: 60, flyers: 40, landing: 40, videos: 5 },
};

function planLabel(plan: string) {
  if (plan === 'starter')   return 'Starter';
  if (plan === 'agent')     return 'Agent';
  if (plan === 'pro_agent') return 'Pro Agent';
  return plan;
}

// ─── Usage bar ────────────────────────────────────────────────────────────────

function UsageBar({
  label,
  remaining,
  total,
}: {
  label: string;
  remaining: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;

  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-700">
          {remaining}
          <span className="font-normal text-gray-400"> / {total}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-lw-rust transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Active plan display ──────────────────────────────────────────────────────

function ActivePlanDisplay({ profile }: { profile: RealtorProfile }) {
  const plan = profile.realtor_plan || 'free';
  const limits = PLAN_LIMITS[plan] ?? { content: 0, flyers: 0, landing: 0, videos: 0 };
  const interval = profile.realtor_plan_interval === 'annual' ? 'Annual' : 'Monthly';
  const isProAgent = plan === 'pro_agent';
  const canUpgrade = plan === 'starter' || plan === 'agent';

  // Use purchased_* as the ceiling, fall back to plan limits so bars render on
  // fresh subscriptions before the webhook sets purchased quantities.
  const contentTotal  = profile.purchased_content_packages  || limits.content;
  const flyersTotal   = profile.purchased_flyers            || limits.flyers;
  const landingTotal  = profile.purchased_landing_pages     || limits.landing;
  const videosTotal   = profile.purchased_slideshow_videos  || limits.videos;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      {/* Plan header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-lw-rust" />
            <h3 className="text-xl font-bold text-gray-900">Listing Studio</h3>
          </div>
          <p className="text-sm text-gray-500">Your content creation workspace</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-lw-rust/10 text-lw-rust border border-lw-rust/20 px-3 py-1 text-sm font-semibold">
            {planLabel(plan)}
          </span>
          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium">
            {interval}
          </span>
        </div>
      </div>

      {/* Usage bars */}
      <div className="space-y-4 mb-6">
        <UsageBar
          label="Content Packages"
          remaining={profile.content_packages_remaining}
          total={contentTotal}
        />
        <UsageBar
          label="Flyers"
          remaining={profile.flyers_remaining}
          total={flyersTotal}
        />
        <UsageBar
          label="Landing Pages"
          remaining={profile.landing_pages_remaining}
          total={landingTotal}
        />
        {isProAgent && (
          <UsageBar
            label="Slideshow Videos"
            remaining={profile.slideshow_videos_remaining}
            total={videosTotal}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold" asChild>
          <a href="#">Access Listing Studio</a>
        </Button>
        <Button
          variant="outline"
          className="border-lw-rust/30 text-gray-700 hover:bg-lw-rust/5"
          asChild
        >
          <a href="#">Buy More Credits</a>
        </Button>
        {canUpgrade && (
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50">
            Upgrade Plan
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Free plan — upgrade cards ────────────────────────────────────────────────

function FreePlanCards() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 md:p-8">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-lw-rust/30 bg-lw-rust/10 px-4 py-1.5 text-sm font-semibold text-lw-rust mb-4">
          <Zap className="h-4 w-4" />
          Listing Studio
        </div>
        <h3 className="text-3xl font-bold text-white mb-2">
          Content That Closes Listings
        </h3>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm">
          AI-powered flyers, landing pages, social content, and email copy — all branded to you. Generate more in less time.
        </p>
      </div>

      {/* Monthly / Annual toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full bg-zinc-900 border border-zinc-700 p-1">
          <button
            onClick={() => setPeriod('monthly')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              period === 'monthly'
                ? 'bg-lw-rust text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('annual')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
              period === 'annual'
                ? 'bg-lw-rust text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Annual
            {period === 'monthly' ? (
              <span className="rounded-full bg-amber-400/20 text-amber-300 px-2 py-0.5 text-xs font-semibold">
                Save ~34%
              </span>
            ) : (
              <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-xs font-semibold">
                ✓ Saving ~34%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {TIERS.map((tier) => {
          const price = period === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

          return (
            <div
              key={tier.id}
              className={`relative rounded-xl p-6 flex flex-col transition-all ${
                tier.highlight
                  ? 'bg-white text-zinc-900 shadow-xl ring-2 ring-lw-rust'
                  : 'bg-zinc-900 border border-zinc-700 text-white'
              }`}
            >
              {/* Most popular badge */}
              {tier.highlightLabel && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-lw-rust text-white text-xs font-bold px-3 py-1 shadow-md">
                    {tier.highlightLabel}
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                  tier.highlight ? 'text-lw-rust' : 'text-zinc-400'
                }`}>
                  {tier.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className={`text-sm mb-1.5 ${
                    tier.highlight ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    /mo
                  </span>
                </div>
                {period === 'annual' ? (
                  <p className={`text-xs mt-1 ${
                    tier.highlight ? 'text-gray-400' : 'text-zinc-500'
                  }`}>
                    Billed annually — save {tier.savingsPct}%
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${
                    tier.highlight ? 'text-gray-400' : 'text-zinc-600'
                  }`}>
                    Or ${tier.annualPrice}/mo billed annually
                  </p>
                )}
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                      tier.highlight ? 'text-lw-rust' : 'text-lw-rust/60'
                    }`} />
                    <span className={tier.highlight ? 'text-zinc-700' : 'text-zinc-300'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a href="#" className="block">
                <Button
                  className={`w-full font-semibold ${
                    tier.highlight
                      ? 'bg-lw-rust hover:bg-lw-rust-hover text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                  }`}
                >
                  Get Started
                </Button>
              </a>
            </div>
          );
        })}
      </div>

      {/* Founding Partner section */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-3">
            <Crown className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <p className="font-bold text-white text-lg">Founding Partner</p>
                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold">
                  Limited Spots
                </span>
              </div>
              <p className="text-zinc-300 text-sm mb-3">
                Lock in your rate before it closes — forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-y-1.5 gap-x-5 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  $199 activation + $59/mo Agent forever
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  $199 activation + $99/mo Pro Agent forever
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <a href="#">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SubscriptionCards({
  realtorProfile,
}: {
  realtorProfile: RealtorProfile | null;
}) {
  const plan = realtorProfile?.realtor_plan ?? 'free';

  if (plan !== 'free' && realtorProfile) {
    return <ActivePlanDisplay profile={realtorProfile} />;
  }

  return <FreePlanCards />;
}
