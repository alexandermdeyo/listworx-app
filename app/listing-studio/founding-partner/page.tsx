'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Crown,
  Lock,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Founding tier data ────────────────────────────────────────────────────────

const FOUNDING_TIERS = [
  {
    id: 'founding_agent_pro',
    name: 'Founding Agent Pro',
    lockedMonthly: 199,
    annualTotal: 2388,
    standardMonthly: 299,
    savingsPerYear: 1200,
    highlight: false,
    badge: null as string | null,
    features: [
      '25 active listings',
      '50 content packages per month',
      '30 flyers per month',
      '30 landing pages per month',
      '3 videos per month',
      'Directory listing and public profile',
      'Unlimited vendor invites',
      'Founding Realtor badge on profile',
      'Rate locked forever — never increases',
    ],
  },
  {
    id: 'founding_elite',
    name: 'Founding Elite',
    lockedMonthly: 399,
    annualTotal: 4788,
    standardMonthly: 599,
    savingsPerYear: 2400,
    highlight: true,
    badge: 'Best Value' as string | null,
    features: [
      'Unlimited listings',
      '150 content packages per month',
      '100 flyers per month',
      '100 landing pages per month',
      '10 videos per month',
      'Priority directory placement',
      '5 team seats',
      'Luxury templates and advanced analytics',
      'Founding Realtor badge on profile',
      'Rate locked forever — never increases',
    ],
  },
];

const STATS = [
  { label: 'Saved per year on Agent Pro', value: '$1,200' },
  { label: 'Saved per year on Elite', value: '$2,400' },
  { label: 'Your locked rate', value: 'Forever' },
];

const FAQS = [
  {
    q: 'What does "locked forever" actually mean?',
    a: 'Your founding rate is the rate you pay for as long as your subscription stays active — even as we raise prices for new members. We will never increase your rate.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'If you cancel, your founding rate is released and you lose access to the locked pricing. If you resubscribe later, you would do so at whatever the current rate is at that time.',
  },
  {
    q: 'How many founding spots are available?',
    a: 'We have a limited number of founding spots. Once they are gone, this program closes. We do not publish the exact number to avoid artificial urgency — but when it is gone, it is gone.',
  },
  {
    q: 'How does billing work?',
    a: 'Founding Partner plans are billed annually. Your card is charged once per year at your locked rate. You get an invoice and a receipt each cycle.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FoundingPartnerPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const PRICE_IDS: Record<string, string> = {
    founding_agent_pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_PRO_ANNUAL || '',
    founding_elite:     process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_ELITE_ANNUAL     || '',
  };

  async function handleCheckout(tierId: string) {
    const priceId = PRICE_IDS[tierId];
    if (!priceId) {
      console.error('No price ID found for', tierId);
      return;
    }

    setLoadingTier(tierId);

    try {
      const res = await fetch('/api/listing-studio/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, interval: 'annual' }),
      });

      if (res.status === 401) {
        window.location.href = '/login?redirect=/listing-studio/founding-partner';
        return;
      }

      if (res.status === 403) {
        alert('Listing Studio is available for realtors. Please create a realtor account.');
        return;
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Orange accent bar ──────────────────────────────────────────────── */}
      <div className="h-1 bg-lw-rust w-full" />

      {/* ── Nav bar ───────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/listing-studio"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listing Studio
          </Link>
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-b border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300 mb-8">
            <Crown className="h-4 w-4" />
            Founding Partner Program
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
            Lock your rate before this window closes.
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Founding Partners get the rate they sign up at — permanently. As we grow and raise prices for new members, your rate stays exactly where it is. For life.
          </p>

          {/* Stat callouts */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4 text-center min-w-[160px]"
              >
                <p className="text-2xl font-bold text-amber-300 mb-1">{stat.value}</p>
                <p className="text-xs text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {FOUNDING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    tier.highlight
                      ? 'bg-white text-zinc-900 shadow-2xl ring-2 ring-amber-400'
                      : 'bg-zinc-900 border border-zinc-700 text-white'
                  }`}
                >
                  {/* Best Value badge */}
                  {tier.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-amber-400 text-black text-xs font-bold px-3 py-1 shadow-md">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Lock indicator */}
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold w-fit mb-5 ${
                    tier.highlight
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    <Lock className="h-3 w-3" />
                    Rate Locked Forever
                  </div>

                  {/* Plan name */}
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                    tier.highlight ? 'text-amber-600' : 'text-amber-400'
                  }`}>
                    {tier.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-bold">${tier.lockedMonthly}</span>
                    <span className={`text-sm mb-2 ${tier.highlight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      /mo
                    </span>
                  </div>
                  <p className={`text-sm mb-1 ${tier.highlight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    ${tier.annualTotal.toLocaleString()}/yr billed annually
                  </p>
                  <p className={`text-xs mb-6 ${tier.highlight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    vs standard ${tier.standardMonthly}/mo — saves ${tier.savingsPerYear.toLocaleString()}/yr
                  </p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                          tier.highlight ? 'text-amber-500' : 'text-amber-400'
                        }`} />
                        <span className={tier.highlight ? 'text-zinc-700' : 'text-zinc-300'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => handleCheckout(tier.id)}
                    disabled={!!loadingTier}
                    className={`w-full font-bold text-base py-6 ${
                      tier.highlight
                        ? 'bg-amber-500 hover:bg-amber-400 text-black'
                        : 'bg-amber-500/90 hover:bg-amber-500 text-black'
                    }`}
                  >
                    {loadingTier === tier.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Lock in {tier.name}
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Founding Realtor Badge ─────────────────────────────────────────── */}
      <section className="py-20 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Founding Realtor Badge
            </h2>
            <p className="text-lg text-zinc-300 mb-6 leading-relaxed">
              Every Founding Partner gets a permanent badge on their ListWorx profile marking them as one of the original members who helped build this platform. It stays there — forever — even as Listing Studio grows.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              It is a small thing, but it is real. The people who show up early deserve to be recognized for it.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-10 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => (
                <Card
                  key={idx}
                  className="border-zinc-800 bg-zinc-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-semibold text-white text-sm leading-snug">
                      {faq.q}
                    </span>
                    {openFaq === idx ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-4">
                      {faq.a}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <footer className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-zinc-500">
            Questions about the Founding Partner program?{' '}
            <a
              href="mailto:support@listworx.co"
              className="text-zinc-400 hover:text-white underline transition-colors"
            >
              support@listworx.co
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}
