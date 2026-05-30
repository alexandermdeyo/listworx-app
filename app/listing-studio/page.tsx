'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/design-system';
import {
  Zap,
  FileText,
  Wand2,
  Copy,
  CircleCheck as CheckCircle,
  Globe,
  FileDown,
  Palette,
  Rocket,
  ArrowRight,
  Crown,
  Loader2,
  BarChart3,
  Film,
  Mic,
  CalendarClock,
  Map,
  Layers,
} from 'lucide-react';

// ─── Pricing data ─────────────────────────────────────────────────────────────

type BillingPeriod = 'monthly' | 'annual';

const TIERS = [
  {
    id: 'starter_agent',
    name: 'Starter Agent',
    monthlyPrice: 119,
    annualPrice: 99,
    annualTotal: 1188,
    savingsPct: 17,
    highlight: false,
    badge: null as string | null,
    features: [
      '8 active listings',
      '15 content packages per month',
      '8 flyers per month',
      '8 landing pages per month',
      'AI captions posts and email copy',
    ],
    noDirectoryListing: true,
  },
  {
    id: 'agent',
    name: 'Agent Pro',
    monthlyPrice: 299,
    annualPrice: 249,
    annualTotal: 2988,
    savingsPct: 17,
    highlight: true,
    badge: 'Most Popular' as string | null,
    features: [
      '25 active listings',
      '50 content packages per month',
      '30 flyers per month',
      '30 landing pages per month',
      '3 videos per month',
      'Directory listing and public profile',
      'Unlimited vendor invites',
    ],
    noDirectoryListing: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 599,
    annualPrice: 499,
    annualTotal: 5988,
    savingsPct: 17,
    highlight: false,
    badge: null as string | null,
    features: [
      'Unlimited listings',
      '150 content packages per month',
      '100 flyers per month',
      '100 landing pages per month',
      '10 videos per month',
      'Priority directory placement',
      '5 team seats',
      'Luxury templates and advanced analytics',
    ],
    noDirectoryListing: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingStudioPage() {
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const PRICE_IDS: Record<string, Record<string, string>> = {
    starter_agent: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_MONTHLY || '',
      annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_ANNUAL  || '',
    },
    agent: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_MONTHLY || '',
      annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_ANNUAL  || '',
    },
    elite: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_MONTHLY || '',
      annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_ANNUAL  || '',
    },
    founding_agent_pro: {
      annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_PRO_ANNUAL || '',
    },
    founding_elite: {
      annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_ELITE_ANNUAL || '',
    },
  };

  async function handleCheckout(tierId: string, interval: string) {
    const priceId = PRICE_IDS[tierId]?.[interval];
    if (!priceId) {
      console.error('No price ID found for', tierId, interval);
      return;
    }

    setLoadingTier(tierId);

    try {
      const res = await fetch('/api/listing-studio/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, interval }),
      });

      if (res.status === 401) {
        window.location.href = '/login?redirect=/listing-studio';
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
    <PageShell surface="dark">
      <Navigation />

      {/* ── SECTION 1 — HERO ──────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-36 overflow-hidden bg-zinc-950 border-b border-zinc-800">
        {/* Subtle radial glow behind the heading */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,98,26,0.14) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Label chip */}
          <div className="inline-flex items-center gap-2 rounded-full border border-lw-rust/30 bg-lw-rust/10 px-4 py-1.5 text-sm font-semibold text-lw-rust mb-8">
            <Zap className="h-4 w-4" />
            Listing Studio
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight max-w-5xl mx-auto">
            Stop spending your evenings writing captions nobody asked you to write.
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Listing Studio is built into your ListWorx account. Put in your listing details. Walk away with everything you need to market it — in about 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-lw-rust hover:bg-lw-rust-hover text-white font-bold shadow-lg"
              >
                See Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                Already a member? Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-20 bg-lw-dark border-b border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How it works</h2>
              <p className="text-lg text-zinc-400 max-w-xl mx-auto">
                Three steps. Two minutes of your time. Everything else is automatic.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 md:gap-8">
              {[
                {
                  step: '01',
                  icon: FileText,
                  title: 'You put in the basics',
                  body: 'Tell us the address, beds, baths, price, and drop in your property description. Upload your photos. Takes about two minutes.',
                },
                {
                  step: '02',
                  icon: Wand2,
                  title: 'We generate everything',
                  body: 'Instagram captions. Facebook post. LinkedIn update. Email subject line and body. Open house announcement. A rewritten property description that actually sounds like a person wrote it. All of it, at once, in about 30 seconds.',
                },
                {
                  step: '03',
                  icon: Copy,
                  title: 'You copy, post, and go',
                  body: 'Everything lands in your dashboard. Copy what you need. Paste it where it goes. Done. No reformatting. No rewriting. No staring at a blank screen.',
                },
              ].map((item, idx) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  {/* Icon with step number badge */}
                  <div className="relative mb-6">
                    <div className="h-20 w-20 rounded-full bg-lw-rust/10 border border-lw-rust/30 flex items-center justify-center">
                      <item.icon className="h-8 w-8 text-lw-rust" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-lw-rust text-white text-xs font-bold flex items-center justify-center shadow">
                      {item.step}
                    </span>
                  </div>
                  {/* Connector line — desktop only, between cards */}
                  {idx < 2 && (
                    <div className="hidden md:block absolute left-[calc(33.33%+2.5rem)] right-0 top-10 h-px bg-zinc-700 pointer-events-none" />
                  )}
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — FEATURE BREAKDOWN ─────────────────────────────────── */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Everything that comes out the other side
              </h2>
            </div>

            <div className="space-y-5">

              {/* Feature 1 — Content Packages */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6 text-lw-rust" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-1.5">
                      Content Packages
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      One content package covers a full listing launch.
                    </h3>
                  </div>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    'Three Instagram caption variations — pick your favorite',
                    'A Facebook post ready to copy',
                    'A LinkedIn update that does not sound like a robot wrote it',
                    'An email subject line and full email body',
                    'An open house announcement',
                    'A rewritten property description that takes your MLS copy and makes it sound like you actually love the neighborhood',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 text-lw-rust shrink-0 mt-0.5" />
                      <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Feature 2 — Landing Pages */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-8">
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex items-center justify-center shrink-0">
                    <Globe className="h-6 w-6 text-lw-rust" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-1.5">
                      Listing Landing Pages
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      A real URL for every property. Ready the same day.
                    </h3>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed mb-3">
                  Every listing you create gets its own shareable page on ListWorx. Your photos. Your stats. Your branding. Your contact info. Text the link to a client. Drop it in your Instagram bio. Put it in your email. It just works.
                </p>
                <p className="text-zinc-400 leading-relaxed">
                  No coding. No Squarespace. No asking your nephew to build you something.
                </p>
              </Card>

              {/* Feature 3 — PDF Flyers */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-8">
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex items-center justify-center shrink-0">
                    <FileDown className="h-6 w-6 text-lw-rust" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-1.5">
                      PDF Flyers
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      Print them. Email them. Hand them out at the open house.
                    </h3>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Listing flyers and open house flyers built from your property data and branded to you. Download as PDF. Done.
                </p>
              </Card>

              {/* Feature 4 — Brand */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-8">
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex items-center justify-center shrink-0">
                    <Palette className="h-6 w-6 text-lw-rust" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-1.5">
                      Your Brand On Everything
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                      This is not generic content. It is yours.
                    </h3>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Your name. Your headshot. Your brokerage. Your colors. Every asset that comes out of Listing Studio has your brand on it. Not ListWorx&apos;s. Yours.
                </p>
              </Card>

              {/* Feature 5 — Coming Soon */}
              <Card className="border-zinc-700/50 bg-zinc-900/30 p-8">
                <div className="flex items-start gap-4 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <Rocket className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                        Coming Soon
                      </p>
                      <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold">
                        In Development
                      </Badge>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-zinc-300">
                      We are not done building.
                    </h3>
                  </div>
                </div>
                <p className="text-zinc-400 leading-relaxed mb-5">
                  These are coming to Listing Studio subscribers first:
                </p>
                <ul className="space-y-3.5">
                  {[
                    {
                      icon: Map,
                      text: 'Neighborhood guides — local restaurants, parks, schools, and lifestyle summaries auto-generated for every listing',
                    },
                    {
                      icon: Film,
                      text: 'Slideshow videos — your listing photos turned into a shareable video automatically',
                    },
                    {
                      icon: Mic,
                      text: 'AI voiceover videos — a professional narrated property video built from your listing data',
                    },
                    {
                      icon: CalendarClock,
                      text: 'Automated social campaigns — schedule and publish your posts without leaving the platform',
                    },
                    {
                      icon: BarChart3,
                      text: 'Market reports — neighborhood stats and trends generated for your farm area',
                    },
                  ].map((item) => (
                    <li key={item.text} className="flex items-start gap-2.5">
                      <item.icon className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="text-zinc-400 text-sm leading-relaxed">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-zinc-500 border-t border-zinc-800 pt-5">
                  Subscribers get early access to every feature as it launches. No extra charge.
                </p>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — TRANSPARENCY ──────────────────────────────────────── */}
      <section className="py-20 bg-lw-dark border-b border-lw-dark-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-lw-dark-border bg-lw-dark-card p-8 md:p-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                What Listing Studio is. And what it is not.
              </h2>
              <div className="space-y-5 text-lg text-zinc-300 leading-relaxed">
                <p>We want to be straight with you about this because we think you deserve that.</p>
                <p>
                  Listing Studio generates marketing content. It does not connect to your MLS. It does not pull listing data automatically. You put in what you want it to use and it works with that.
                </p>
                <p>
                  The AI writes copy based on what you give it. It is good — genuinely good — but you should read it before you post it. It is a tool, not a replacement for your judgment.
                </p>
                <p>
                  The landing pages it creates are shareable marketing pages, not IDX listings. They live on ListWorx, not your brokerage site.
                </p>
                <p>
                  We are building fast. Some features listed above are coming soon. Subscribers get them as they launch — no waiting, no upsells, no surprise charges.
                </p>
                <p className="text-white font-semibold">
                  That is the deal. If it sounds right for how you work, we would love to have you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Simple pricing. No surprises.
              </h2>
            </div>

            {/* Monthly / Annual toggle */}
            <div className="flex justify-center mb-10">
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
                      Save ~17%
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/20 text-white px-2 py-0.5 text-xs font-semibold">
                      ✓ Saving ~17%
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tier cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              {TIERS.map((tier) => {
                const price = period === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl p-7 flex flex-col transition-all ${
                      tier.highlight
                        ? 'bg-white text-zinc-900 shadow-2xl ring-2 ring-lw-rust'
                        : 'bg-zinc-900 border border-zinc-700 text-white'
                    }`}
                  >
                    {/* Most Popular badge */}
                    {tier.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-lw-rust text-white text-xs font-bold px-3 py-1 shadow-md">
                          {tier.badge}
                        </span>
                      </div>
                    )}

                    {/* Plan name + price */}
                    <div className="mb-5">
                      <p
                        className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                          tier.highlight ? 'text-lw-rust' : 'text-zinc-400'
                        }`}
                      >
                        {tier.name}
                      </p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span
                          className={`text-sm mb-1.5 ${
                            tier.highlight ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          /mo
                        </span>
                      </div>
                      {period === 'annual' ? (
                        <p
                          className={`text-xs mt-1 ${
                            tier.highlight ? 'text-gray-500' : 'text-zinc-500'
                          }`}
                        >
                          Billed annually — ${tier.annualTotal.toLocaleString()}/year
                        </p>
                      ) : (
                        <p
                          className={`text-xs mt-1 ${
                            tier.highlight ? 'text-gray-400' : 'text-zinc-600'
                          }`}
                        >
                          Or ${tier.annualPrice}/mo billed annually
                        </p>
                      )}
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle
                            className={`h-4 w-4 mt-0.5 shrink-0 ${
                              tier.highlight ? 'text-lw-rust' : 'text-lw-rust/60'
                            }`}
                          />
                          <span className={tier.highlight ? 'text-zinc-700' : 'text-zinc-300'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleCheckout(tier.id, period)}
                      disabled={loadingTier === tier.id}
                      className={`w-full font-semibold ${
                        tier.highlight
                          ? 'bg-lw-rust hover:bg-lw-rust-hover text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                      }`}
                    >
                      {loadingTier === tier.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Get Started'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Note below cards */}
            <p className="text-center text-zinc-400 text-sm mb-10">
              All plans include the referral matching service at no extra charge. That part is always free.
            </p>

            {/* Founding Partner bar */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-900 to-amber-950/20 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-start gap-3">
                  <Crown className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-white text-lg">Founding Partner — Lock Your Rate Forever</p>
                      <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold">
                        Limited Spots
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Agent Pro at $199/mo or Elite at $399/mo — locked forever.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button
                    onClick={() => handleCheckout('founding_agent_pro', 'annual')}
                    disabled={loadingTier === 'founding_agent_pro'}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap"
                  >
                    {loadingTier === 'founding_agent_pro' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                    ) : (
                      'Founding Agent Pro'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCheckout('founding_elite', 'annual')}
                    disabled={loadingTier === 'founding_elite'}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold whitespace-nowrap"
                  >
                    {loadingTier === 'founding_elite' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
                    ) : (
                      'Founding Elite'
                    )}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 6 — BOTTOM CTA ────────────────────────────────────────── */}
      <section className="py-24 bg-lw-rust">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Zap className="h-14 w-14 text-white mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to stop doing this the hard way?
            </h2>
            <p className="text-lg text-white/80 mb-8">Your first listing is waiting.</p>
            <a href="#pricing">
              <Button
                size="lg"
                className="text-lg px-10 py-6 rounded-lg bg-white text-lw-rust hover:bg-white/90 font-bold shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <p className="mt-6 text-sm text-white/60">
              Questions? Reach out at{' '}
              <a
                href="mailto:support@listworx.co"
                className="underline hover:text-white transition-colors"
              >
                support@listworx.co
              </a>
            </p>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
