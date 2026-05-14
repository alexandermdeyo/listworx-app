import Link from 'next/link';
import { CheckCircle, Crown, Shield, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';
import { FOUNDER_TIERS } from '@/lib/tiers-config';

const features = [
  ['12 Months Included Access', '$149 activation fee covers your first full year in the network. No monthly charges until month 13.'],
  ['Founding Partner Badge', 'Displayed on every referral we send. Realtors and homeowners see it. It signals you were vetted, you were first, and you earned it.'],
  ['Price Lock — For Life', 'Your renewal rate is locked permanently as long as you stay active and maintain IronClad Standards. Standard pricing goes up over time. Your founder rate never does.'],
  ['Territory Reservation', 'Your trade and county is reserved for you. When your spot fills, no other contractor of the same trade joins at founder pricing in your county.'],
  ['Priority Launch Positioning', 'Founding Partners are positioned at the top of the referral rotation during the platform launch period.'],
  ['IronClad Decal Package', 'Founding Partners receive a discounted IronClad decal package for their vehicle or job sites — a visible signal of network membership.'],
];

const spots = [
  ['Sumner County', 'Painters', 3], ['Sumner County', 'HVAC', 2], ['Sumner County', 'Plumbers', 3], ['Sumner County', 'Handymen', 2],
  ['Nashville Metro', 'Painters', 2], ['Nashville Metro', 'HVAC', 3], ['Nashville Metro', 'Plumbers', 2], ['Nashville Metro', 'Handymen', 3],
];

const faqs = [
  ['Is the $149 a monthly fee?', 'No. It is a one-time activation fee. Your first 12 months of network access are included. After that, you are billed at your locked founder renewal rate — $99, $199, or $349/month depending on your tier.'],
  ['What happens if I cancel and want to come back?', 'If you cancel your subscription, your Founding Partner pricing is permanently forfeited. You would re-enter at standard pricing. We recommend pausing rather than canceling if you need a break — contact us and we will work with you.'],
  ['Can my Founding Partner status be taken away?', 'Yes. Founders who violate IronClad Standards — ghosting customers, letting insurance lapse, unprofessional conduct — lose Founding Partner status and may be removed from the network entirely. This is how we protect the network for everyone.'],
  ['What is the referral volume guarantee?', 'There is none. ListWorx does not guarantee a specific number of referrals. What we guarantee is that when requestors in your area submit a job in your trade, you are in the rotation to be one of the three referrals returned — prioritized by tier and IronClad compliance. Referral volume grows as the network grows.'],
  ['Is my territory exclusive?', 'Founding Partners have territory reservation — meaning no other contractor of your trade joins at Founding Partner pricing in your county once your tier fills. The network itself is not exclusive; multiple contractors of the same trade can be in the network at standard pricing after founder spots close.'],
];

const founderRows = [
  { label: 'Activation Fee', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.activationFee} one-time` },
  { label: 'First 12 Months', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => tier.firstYear },
  { label: 'Renewal Rate', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.renewalRate}/month` },
  { label: 'Standard Rate', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.standardRate}/month` },
  { label: 'You Save', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.savingsMonthly}/mo forever` },
  { label: 'Annual Savings', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.savingsAnnual}/year` },
  { label: 'Spots Per County', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `${tier.spotsPerCounty} per trade` },
];

export default function FoundingPartnerPage() {
  const eliteFounder = FOUNDER_TIERS.find((tier) => tier.baseTierId === 'elite');

  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="relative overflow-hidden py-20 text-center">
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 container mx-auto px-4">
          <Image src="/ironclad_founder_shield_logo.png" alt="IronClad Founding Partner" width={132} height={132} className="mx-auto mb-5 h-28 w-auto" />
          <h1 className="mb-6 text-5xl md:text-7xl font-bold text-white">Become a Founding Partner</h1>
          <p className="mx-auto max-w-4xl text-lg text-zinc-300 leading-relaxed">
            This is not a discount. This is a founder opportunity. A limited number of contractors will lock in permanent pricing, territory reservation, and Founding Partner status before we open to the public. Once your trade fills in your county — it&apos;s done.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-4xl font-bold text-white">What You Get</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, body]) => (
            <Card key={title} className="border-zinc-800 bg-zinc-950 p-6">
              <CheckCircle className="mb-4 h-6 w-6 text-amber-400" />
              <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
              <p className="text-zinc-400 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-white">Founding Partner Pricing</h2>
        <p className="mb-6 text-zinc-400">One-time $149 activation fee covers all tiers. Your renewal rate depends on the tier you choose.</p>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[860px] bg-zinc-950 text-left text-sm">
            <thead>
              <tr>
                <th className="p-4 text-white">Tier</th>
                {FOUNDER_TIERS.map((tier) => <th key={tier.id} className="p-4 text-white">{tier.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {founderRows.map((row) => (
                <tr key={row.label} className="border-t border-zinc-800">
                  <td className="p-4 font-semibold text-zinc-200">{row.label}</td>
                  {FOUNDER_TIERS.map((tier) => <td key={tier.id} className="p-4 text-zinc-400">{row.getValue(tier)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          Elite spots are extremely limited — 2 per trade per county. If you want Elite, move now.
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-4xl font-bold text-white">What You Get at Each Founder Tier</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FOUNDER_TIERS.map((tier) => (
            <Card key={tier.id} className="border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-4 text-2xl font-bold text-white">{tier.name}</h3>
              <ul className="space-y-3">
                {tier.included.map((item) => (
                  <li key={item} className="flex gap-2 text-zinc-300">
                    <CheckCircle className="h-5 w-5 shrink-0 text-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        {eliteFounder && (
          <div className="mt-8 rounded-xl border border-lw-rust bg-lw-rust/10 p-5 text-orange-100">
            <p className="font-bold">Only {eliteFounder.spotsPerCounty} Elite spots per trade per county.</p>
            <p>Once filled this tier closes permanently in your county.</p>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-4xl font-bold text-white">Spots Remaining in Your Area</h2>
        {/* TODO: wire this to Supabase territory availability */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {spots.map(([county, trade, remaining]) => (
            <Card key={`${county}-${trade}`} className="border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">{county}</p>
              <h3 className="text-xl font-bold text-white">{trade}</h3>
              <p className="mt-3 text-amber-400 font-semibold">{remaining} founder spots left</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-4xl font-bold text-white">Questions Contractors Ask Before Joining</h2>
        <div className="space-y-4">
          {faqs.map(([q, a]) => (
            <Card key={q} className="border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-2 text-xl font-bold text-white">{q}</h3>
              <p className="text-zinc-400 leading-relaxed">{a}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 text-center">
        <Crown className="mx-auto mb-5 h-12 w-12 text-amber-400" />
        <h2 className="mb-5 text-5xl font-bold text-white">Your County Won&apos;t Stay Open Forever</h2>
        <p className="mx-auto mb-8 max-w-3xl text-zinc-300">Founding Partner pricing closes permanently as each trade fills by county. When the spots are gone, the next contractor pays standard pricing.</p>
        <Link href="/apply"><Button size="lg" className="bg-amber-500 px-8 text-black hover:bg-amber-400">Apply for Founding Partner Status</Button></Link>
      </section>
    </PageShell>
  );
}
