'use client';

import Link from 'next/link';
import { BadgeCheck, CheckCircle, Filter, Shield, Star, ArrowRight, Crown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';

const founderBenefits = [
  '12 months of included network access after $149 activation',
  'Founding Partner badge on your profile — permanent',
  'Locked renewal pricing for life, as low as $99/month after year one',
  'Territory reservation for your trade and county',
  'Priority positioning during platform launch',
  'IronClad decal package',
];

const ironcladItems = [
  'Respond to referrals within 24 hours',
  'Maintain valid insurance and licenses at all times',
  'Never ghost a customer or leave a job unfinished',
  'Communicate professionally',
  'Deliver quality work, every time',
  'Maintain your reputation — we monitor it',
];

const testimonials = [
  { name: '[Contractor Name]', trade: '[Trade]', city: '[City] TN' },
  { name: '[Contractor Name]', trade: '[Trade]', city: '[City] TN' },
  { name: '[Contractor Name]', trade: '[Trade]', city: '[City] TN' },
];

export default function LandingPage() {
  return (
    <PageShell surface="dark">
      <Navigation />

      <section className="container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-lw-rust/30 bg-lw-rust/10 px-4 py-2 text-sm font-semibold text-lw-rust">
            <Shield className="mr-2 h-4 w-4" />
            IronClad-certified referral network
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            The Contractor Network Built on Trust, Not Transactions.
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg md:text-xl text-zinc-300 leading-relaxed">
            ListWorx connects realtors and homeowners with vetted, IronClad-certified contractors. No referral fees. No bidding wars. Just trusted referrals — and only three per request.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <Link href="/apply">
              <Button size="lg" className="w-full sm:w-auto bg-lw-rust hover:bg-lw-rust-hover text-white">
                Apply to Join the Network
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/request">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-lw-rust text-lw-rust hover:bg-lw-rust hover:text-white">
                Request a Referral
              </Button>
            </Link>
          </div>
          <p className="text-sm text-zinc-400">
            Trusted by realtors and homeowners in Nashville, Sumner County, and Minneapolis.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Shield,
              title: 'Not a Lead Marketplace',
              body: "We don't sell your contact info to the highest bidder. ListWorx is a vetted referral network. Contractors pay a flat monthly fee and get connected to people who actually need their work.",
            },
            {
              icon: Filter,
              title: 'Only 3 Referrals Per Request',
              body: 'Every requestor gets exactly three contractor referrals — not a dozen. Quality over volume. The contractors we send are vetted, IronClad-certified, and ready to work.',
            },
            {
              icon: BadgeCheck,
              title: 'IronClad Standards Required',
              body: "Every contractor in the network must maintain IronClad Standards — fast response, valid insurance, professional communication, no ghosting. Fall short and you're out. That's the deal.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border-zinc-800 bg-zinc-950/80 p-6">
                <Icon className="mb-4 h-8 w-8 text-lw-rust" />
                <h2 className="mb-3 text-2xl font-bold text-white">{item.title}</h2>
                <p className="text-zinc-400 leading-relaxed">{item.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-950 p-8">
            <h2 className="mb-6 text-3xl font-bold text-white">For Contractors</h2>
            {[
              'Apply and get vetted',
              'Complete your IronClad certification',
              'Choose your subscription tier',
              'Receive referrals from realtors and homeowners in your area',
              'Build your reputation inside the network',
            ].map((step, index) => (
              <div key={step} className="mb-4 flex gap-3 text-zinc-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lw-rust text-sm font-bold text-white">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </Card>
          <Card className="border-zinc-800 bg-zinc-950 p-8">
            <h2 className="mb-6 text-3xl font-bold text-white">For Realtors & Homeowners</h2>
            {[
              'Submit a job request — takes 60 seconds',
              'Receive exactly 3 vetted contractor referrals',
              'Contact your contractor directly — no middleman',
              'Leave feedback to keep the network strong',
            ].map((step, index) => (
              <div key={step} className="mb-4 flex gap-3 text-zinc-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lw-rust text-sm font-bold text-white">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-r from-zinc-950 via-lw-rust/25 to-zinc-950 border-y border-lw-rust/40 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <Crown className="mx-auto mb-4 h-10 w-10 text-amber-400" />
            <h2 className="mb-4 text-3xl md:text-5xl font-bold text-white">Founding Partner Spots Are Open — But Not For Long</h2>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-zinc-200">
              We are accepting a limited number of Founding Partners in each trade and county. When your trade fills, that&apos;s it. No exceptions, no waitlist.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8 text-left">
              {founderBenefits.map((benefit) => (
                <div key={benefit} className="flex gap-2 rounded-lg bg-black/30 p-3 text-sm text-zinc-100">
                  <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  {benefit}
                </div>
              ))}
            </div>
            <Link href="/founding-partner">
              <Button size="lg" className="bg-amber-500 text-black hover:bg-amber-400">Reserve My Founding Partner Spot</Button>
            </Link>
            <p className="mt-4 text-sm text-zinc-300">$149 one-time activation. 12 months included. Then $99–$349/month depending on tier — locked for life.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-4xl font-bold text-white">What IronClad Standards Mean</h2>
          <p className="mb-8 text-lg text-zinc-300">
            Every contractor in the ListWorx network is held to IronClad Standards. This is not a suggestion. It is the cost of being in the network.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {ironcladItems.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-zinc-200">
                <CheckCircle className="h-5 w-5 shrink-0 text-lw-rust" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-8 text-zinc-300">
            Contractors who fall short of IronClad Standards are removed from the network. Founding Partner status can be revoked. We protect the network so the network protects you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-4xl font-bold text-white">What Contractors Are Saying</h2>
        {/* TODO: replace with real testimonials from Supabase */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-zinc-800 bg-zinc-950 p-6">
              <Star className="mb-4 h-5 w-5 text-amber-400" />
              <p className="mb-5 text-zinc-200">“Finally a platform that treats contractors like professionals, not commodities.”</p>
              <p className="text-sm font-semibold text-white">{testimonial.name}</p>
              <p className="text-sm text-zinc-500">{testimonial.trade}, {testimonial.city}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="mb-4 text-4xl md:text-5xl font-bold text-white">Ready to Join the Network?</h2>
        <div className="mb-5 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/apply"><Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white">Apply as a Contractor</Button></Link>
          <Link href="/request"><Button size="lg" variant="outline" className="border-lw-rust text-lw-rust hover:bg-lw-rust hover:text-white">Request a Referral</Button></Link>
        </div>
        <p className="text-zinc-400">Realtors and homeowners use ListWorx free. Contractors — Founding Partner spots are limited. Apply now.</p>
      </section>
    </PageShell>
  );
}
