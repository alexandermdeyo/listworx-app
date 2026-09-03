'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/design-system';
import { CheckCircle, Crown } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { useAcademyEnabled } from '@/lib/useAcademyEnabled';

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
      'Google Business Profile optimization on signup',
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

const RED = 'bg-[#B91C1C] hover:bg-[#991b1b]';
const RED_OUTLINE = 'border-2 border-[#B91C1C] text-[#B91C1C] bg-transparent hover:bg-[#B91C1C]/5';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const academyEnabled = useAcademyEnabled();

  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />
      <section className="bg-lw-rust py-4 text-center text-white">
        <p className="font-semibold">⚡ Founding Partner spots are open in Nashville and Sumner County. Limited per trade. When they&apos;re gone, they&apos;re gone.</p>
      </section>

      {/* FOUNDING INTRO */}
      <section className="container mx-auto px-4 pt-16 pb-8 text-center">
        <Badge className="bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30 mb-4">
          <Crown className="h-3 w-3 mr-1" />
          Founding Member Pricing
        </Badge>
        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-mkt-ink">Founding Member Pricing — Limited by County</h1>
        <p className="mx-auto max-w-2xl text-mkt-ink/70 text-lg">
          Founding spots are limited per trade, per county. Contractors who join during the founding period lock in their rate for life — it never increases as long as membership stays active. No setup fee. No activation charge. Just your monthly or annual membership rate, locked the day you join.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${!isAnnual ? 'bg-mkt-ink text-white' : 'text-mkt-ink/60'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isAnnual ? 'bg-mkt-ink text-white' : 'text-mkt-ink/60'}`}
          >
            Annual — save 2 months
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8">
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {foundingPlans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 70} pulse={plan.highlight}>
              <Card
                className={`lw-hover-lift relative flex h-full flex-col bg-white text-mkt-ink shadow-sm p-6 ${
                  plan.highlight ? 'border-2 border-[#B91C1C] shadow-lg' : 'border-zinc-200'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#B91C1C] px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </span>
                )}
                <Badge className="mb-4 w-fit bg-mkt-navy/10 text-mkt-navy border-mkt-navy/20">
                  Founding Member
                </Badge>
                <h2 className="text-2xl font-bold text-mkt-ink">{plan.name}</h2>
                <p className="mb-1 mt-2 text-3xl font-bold text-[#B91C1C]">
                  {isAnnual ? `$${plan.annual.toLocaleString()}` : `$${plan.monthly}`}
                  <span className="text-base font-semibold text-mkt-ink/60">{isAnnual ? '/yr' : '/mo'}</span>
                </p>
                <p className="mb-5 text-xs text-mkt-ink/60">
                  Billed {isAnnual ? 'annually' : 'monthly'} · Rate locked for life{isAnnual ? ' · save 2 months' : ''}
                </p>
                <div className="mb-4 space-y-3 flex-1">
                  {BASE_FEATURES.map(feature => (
                    <div key={feature} className="flex gap-2 text-mkt-ink/80 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[#B91C1C] mt-0.5" />
                      {feature}
                    </div>
                  ))}
                  {academyEnabled && (
                    <div className="flex gap-2 text-mkt-ink/80 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[#B91C1C] mt-0.5" />
                      ListWorx Academy access — powered by ACES
                    </div>
                  )}
                  {plan.extra && plan.extra.map(feature => (
                    <div key={feature} className="flex gap-2 text-mkt-ink font-semibold text-sm pt-1 border-t border-zinc-100 mt-3 first:border-t-0 first:mt-0 first:pt-0">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[#B91C1C] mt-0.5" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href="/founding-partner">
                  <Button className={`w-full text-white ${RED}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-mkt-ink/60">
          Elite spots are limited by trade and county. Once filled, Elite is closed to new members in that market.
        </p>
      </section>

      <section className="bg-zinc-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-mkt-ink">Standard Pricing — After Founding Spots Close</h2>
          <p className="mb-8 text-center text-mkt-ink/70">For contractors joining after Founding Partner spots close in their county.</p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {standardPlans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 70}>
                <Card className="bg-white text-mkt-ink shadow-sm p-6 border-zinc-200 flex h-full flex-col">
                  <h3 className="text-xl font-bold text-mkt-ink">{plan.name}</h3>
                  <p className="mb-1 mt-2 text-2xl font-bold text-mkt-ink/80">
                    {isAnnual ? `$${plan.annual.toLocaleString()}` : `$${plan.monthly}`}
                    <span className="text-sm font-semibold text-mkt-ink/50">{isAnnual ? '/yr' : '/mo'}</span>
                  </p>
                  <p className="mb-5 text-xs text-mkt-ink/50">{isAnnual ? 'Billed annually · save 2 months' : 'Billed monthly'}</p>
                  <div className="mb-6 space-y-3 flex-1">
                    {BASE_FEATURES.map(feature => (
                      <div key={feature} className="flex gap-2 text-mkt-ink/70 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0 text-mkt-ink/40 mt-0.5" />
                        {feature}
                      </div>
                    ))}
                    {academyEnabled && (
                      <div className="flex gap-2 text-mkt-ink/70 text-sm">
                        <CheckCircle className="h-4 w-4 shrink-0 text-mkt-ink/40 mt-0.5" />
                        ListWorx Academy access — powered by ACES
                      </div>
                    )}
                  </div>
                  <Link href="/apply"><Button className={`w-full text-white ${RED}`}>{plan.cta}</Button></Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mkt-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Reveal as="div">
            <h2 className="text-4xl font-bold text-white">Free for Realtors and Homeowners</h2>
            <p className="mx-auto my-5 max-w-2xl text-white/70">
              Using ListWorx to find and refer contractors is always free. Realtors and homeowners create a free account, submit a job request, and receive referrals from IronClad Verified contractors in their area. No fees, no subscriptions, no pay-per-lead. The contractors pay to be in the network — you just get the referrals.
            </p>
            <Link href="/request"><Button className={RED_OUTLINE}>Request a Contractor</Button></Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
