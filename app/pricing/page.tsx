'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/design-system';
import { CircleCheck as CheckCircle, Crown, TrendingUp, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import TristarMark from '@/components/site/TristarMark';
import { useAcademyEnabled } from '@/lib/useAcademyEnabled';
import { TIER_GROWTH_NOTE } from '@/lib/tiers-config';

const BASE_FEATURES = [
  'IronClad Verified status',
  'Profile on the ListWorx platform',
  'Listed in referral rotation',
  'Contractor dashboard access',
  'Email notifications when you’re matched',
  'Verified reviews system',
  'Availability and service-area controls',
];

const foundingPlans = [
  {
    name: 'Network Member',
    monthly: 199,
    annual: 1990,
    highlight: false,
    extra: null as string[] | null,
    cta: 'Join the Network',
  },
  {
    name: 'Network Partner',
    monthly: 349,
    annual: 3490,
    highlight: true,
    extra: [
      'Priority placement — above all Network Members',
      'Enhanced profile with additional photos and expanded bio',
      'IronClad Digital Badge Kit included (vehicle, digital, print)',
      'AI Marketing Toolkit — social posts, follow-up emails, job templates',
      'SMS + email notifications for every match',
      'Monthly performance report',
      'Quarterly profile boost',
    ],
    cta: 'Join the Network',
  },
  {
    name: 'Network Elite',
    monthly: 599,
    annual: 5990,
    highlight: false,
    extra: [
      'Everything in Network Partner, plus:',
      'Top of rotation — always above Partner and Member',
      'Territory lock — maximum 2 Elite per trade per county',
      'Monthly profile boost (not quarterly)',
      '2 social media posts per month featuring your work',
      'Annual featured contractor spotlight',
    ],
    cta: 'Join the Network — Limited Spots',
  },
];

const standardPlans = [
  { name: 'Network Member', monthly: 249, annual: 2490, cta: 'Apply Now' },
  { name: 'Network Partner', monthly: 429, annual: 4290, cta: 'Apply Now' },
  { name: 'Network Elite', monthly: 729, annual: 7290, cta: 'Apply Now — Limited Spots' },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const academyEnabled = useAcademyEnabled();

  return (
    <PageShell surface="marketing" className="!bg-mailer-black !text-white">
      <Navigation variant="light" />

      <section className="bg-lw-rust py-3 text-center text-white">
        <p className="px-4 text-sm font-semibold md:text-base">
          Founding Partner spots are open in Nashville and Sumner County. Limited per trade — when
          they&apos;re gone, they&apos;re gone.
        </p>
      </section>

      {/* ================= FOUNDING INTRO ================= */}
      <section className="relative overflow-hidden bg-mailer-black py-16 md:py-24">
        <div className="h-1 w-full bg-lw-rust" />
        <TristarMark className="pointer-events-none absolute bottom-6 right-6 h-40 w-40 text-white/[0.04] md:h-56 md:w-56" />
        <div className="container relative mx-auto max-w-3xl px-4 pt-10 text-center">
          <Reveal>
            <p className="lw-label-lg mb-3 inline-flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Founding Partner pricing
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Lock your rate. Limited by county.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/65">
              Founding spots are limited per trade, per county. Join during the founding period and
              your rate is locked for life — it never increases as long as membership stays active.
              No setup fee, no activation charge.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-mailer-border bg-mailer-card p-1">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  !isAnnual ? 'bg-lw-rust text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isAnnual ? 'bg-lw-rust text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Annual — save 2 months
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= FOUNDING TIERS ================= */}
      <section className="bg-mailer-black pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {foundingPlans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 70} pulse={plan.highlight}>
                <div
                  className={`lw-hover-lift-dark relative flex h-full flex-col rounded-2xl border bg-mailer-card p-7 ${
                    plan.highlight
                      ? 'border-lw-rust shadow-lg shadow-lw-rust/10'
                      : 'border-mailer-border'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-lw-rust px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                      Most Popular
                    </span>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest text-white/45">
                    Founding Partner
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-white">{plan.name}</h2>
                  <p className="mt-3 text-4xl font-bold text-lw-rust">
                    {isAnnual ? `$${plan.annual.toLocaleString()}` : `$${plan.monthly}`}
                    <span className="text-base font-normal text-white/40">
                      {isAnnual ? '/yr' : '/mo'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Billed {isAnnual ? 'annually' : 'monthly'} · rate locked for life
                    {isAnnual ? ' · save 2 months' : ''}
                  </p>

                  <div className="mt-5 flex-1 space-y-2.5 border-t border-mailer-border pt-5 text-sm text-white/70">
                    {BASE_FEATURES.map((feature) => (
                      <div key={feature} className="flex gap-2.5">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lw-rust" />
                        {feature}
                      </div>
                    ))}
                    {academyEnabled && (
                      <div className="flex gap-2.5">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lw-rust" />
                        ListWorx Academy access — powered by ACES
                      </div>
                    )}
                    {plan.extra?.map((feature, i) => (
                      <div
                        key={feature}
                        className={`flex gap-2.5 font-semibold text-white ${
                          i === 0 ? 'mt-3 border-t border-mailer-border pt-3' : ''
                        }`}
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lw-rust" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link href="/founding-partner" className="mt-6 block">
                    <Button
                      className={
                        plan.highlight
                          ? 'w-full bg-lw-rust text-white hover:bg-lw-rust-hover'
                          : 'w-full border-2 border-lw-rust bg-transparent text-white hover:bg-lw-rust/10'
                      }
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-white/50">
            Elite spots are limited by trade and county. Once filled, Elite is closed to new members
            in that market.
          </p>

          <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-lw-rust/30 bg-lw-rust/[0.07] p-5">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
            <p className="text-sm leading-relaxed text-white/85">{TIER_GROWTH_NOTE}</p>
          </div>
        </div>
      </section>

      {/* ================= STANDARD PRICING ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="lw-label-lg mb-3">After the founding period</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Standard pricing
            </h2>
            <p className="mt-3 text-white/60">
              For contractors who join after Founding Partner spots close in their county.
            </p>
          </Reveal>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {standardPlans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 70}>
                <div className="flex h-full flex-col rounded-2xl border border-mailer-border bg-mailer-card p-7">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold text-white/85">
                    {isAnnual ? `$${plan.annual.toLocaleString()}` : `$${plan.monthly}`}
                    <span className="text-sm font-normal text-white/40">
                      {isAnnual ? '/yr' : '/mo'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {isAnnual ? 'Billed annually · save 2 months' : 'Billed monthly'}
                  </p>
                  <div className="mt-5 flex-1 space-y-2.5 border-t border-mailer-border pt-5 text-sm text-white/65">
                    {BASE_FEATURES.map((feature) => (
                      <div key={feature} className="flex gap-2.5">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                        {feature}
                      </div>
                    ))}
                    {academyEnabled && (
                      <div className="flex gap-2.5">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                        ListWorx Academy access — powered by ACES
                      </div>
                    )}
                  </div>
                  <Link href="/apply" className="mt-6 block">
                    <Button className="w-full bg-lw-rust text-white hover:bg-lw-rust-hover">
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-xl border border-lw-rust/30 bg-lw-rust/[0.07] p-5">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
            <p className="text-sm leading-relaxed text-white/85">{TIER_GROWTH_NOTE}</p>
          </div>
        </div>
      </section>

      {/* ================= FREE FOR REALTORS / HOMEOWNERS ================= */}
      <section className="relative overflow-hidden bg-mailer-black py-16 md:py-24">
        <div className="h-1 w-full bg-lw-rust" />
        <div className="container mx-auto px-4 pt-10 text-center">
          <Reveal className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Free for realtors and homeowners
            </h2>
            <p className="mx-auto mt-4 text-white/65">
              Finding and referring contractors through ListWorx is always free. Create an account,
              submit a request, and get matches from IronClad Verified contractors in your area. No
              fees, no subscriptions, no pay-per-lead. The contractors pay to be in the network —
              you just get the referrals.
            </p>
            <Link href="/request" className="mt-8 inline-block">
              <Button
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Request a contractor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
