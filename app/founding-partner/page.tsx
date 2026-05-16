import Link from 'next/link';
import { CheckCircle, Crown, Shield, AlertTriangle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';

const features = [
  ['12 Months Included Access', '$199 activation fee covers your first full year in the network. No monthly charges until month 13.'],
  ['Founding Partner Badge', 'Displayed on every referral we send. Realtors and homeowners see it. It signals you were vetted, you were first, and you earned it.'],
  ['Price Lock — For Life', 'Your renewal rate is locked permanently as long as you stay active and maintain IronClad Standards. Standard pricing goes up over time. Your founder rate never does.'],
  ['Territory Reservation', 'Your trade and county is reserved for you. When your spot fills, no other contractor of the same trade joins at founder pricing in your county.'],
  ['Priority Launch Positioning', 'Founding Partners are positioned at the top of the referral rotation during the platform launch period.'],
  ['IronClad Decal Package', 'Founding Partners receive a discounted IronClad decal package for their vehicle or job sites — a visible signal of network membership.'],
];

const pricingRows = [
  ['Activation Fee', '$199 one-time', '$199 one-time', '$199 one-time'],
  ['First 12 Months', 'Included', 'Included', 'Included'],
  ['Renewal Rate', '$159/month', '$279/month', '$479/month'],
  ['Standard Rate', '$199/month', '$349/month', '$599/month'],
  ['You Save', '$40/mo forever', '$70/mo forever', '$120/mo forever'],
  ['Spots Per County', '10 per trade', '5 per trade', '2 per trade'],
];

const spots = [
  ['Sumner County', 'Painters', 3], ['Sumner County', 'HVAC', 2], ['Sumner County', 'Plumbers', 3], ['Sumner County', 'Handymen', 2],
  ['Nashville Metro', 'Painters', 2], ['Nashville Metro', 'HVAC', 3], ['Nashville Metro', 'Plumbers', 2], ['Nashville Metro', 'Handymen', 3],
];

const faqs = [
  ['Is the $199 a monthly fee?', 'No. It is a one-time activation fee. Your first 12 months of network access are included. After that, you are billed at your locked founder renewal rate — $159, $279, or $479/month depending on your tier.'],
  ['What happens if I cancel and want to come back?', 'If you cancel your subscription, your Founding Partner pricing is permanently forfeited. You would re-enter at standard pricing. We recommend pausing rather than canceling if you need a break — contact us and we will work with you.'],
  ['Can my Founding Partner status be taken away?', 'Yes. Founders who violate IronClad Standards — ghosting customers, letting insurance lapse, unprofessional conduct — lose Founding Partner status and may be removed from the network entirely. This is how we protect the network for everyone.'],
  ['What is the referral volume guarantee?', 'There is none. ListWorx does not guarantee a specific number of referrals. What we guarantee is that when requestors in your area submit a job in your trade, you are in the rotation to be one of the three referrals returned — prioritized by tier and IronClad compliance. Referral volume grows as the network grows.'],
  ['Is my territory exclusive?', 'Founding Partners have territory reservation — meaning no other contractor of your trade joins at Founding Partner pricing in your county once your tier fills. The network itself is not exclusive; multiple contractors of the same trade can be in the network at standard pricing after founder spots close.'],
];

export default function FoundingPartnerPage() {
  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="container mx-auto px-4 py-20 text-center">
        <img
          src="/ironclad_founder_shield_logo.png"
          alt="ListWorx Founding Partner"
          className="mx-auto mb-5 h-24 md:h-32 w-auto drop-shadow-lg"
        />
        <h1 className="mb-6 text-5xl md:text-7xl font-bold text-white">Become a Founding Partner</h1>
        <p className="mx-auto max-w-4xl text-lg text-zinc-300 leading-relaxed">
          This is not a discount. This is a founder opportunity. A limited number of contractors will lock in permanent pricing, territory reservation, and Founding Partner status before we open to the public. Once your trade fills in your county — it&apos;s done.
        </p>
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
        <p className="mb-6 text-zinc-400">One-time $199 activation fee covers all tiers. Your renewal rate depends on the tier you choose.</p>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[760px] bg-zinc-950 text-left text-sm">
            <thead><tr>{['', 'Basic Founder', 'Preferred Founder', 'Elite Founder'].map(h => <th key={h} className="p-4 text-white">{h}</th>)}</tr></thead>
            <tbody>{pricingRows.map(row => <tr key={row[0]} className="border-t border-zinc-800">{row.map((cell, i) => <td key={cell} className={`p-4 ${i === 0 ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
          Elite spots are extremely limited — 2 per trade per county. If you want Elite, move now.
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-lw-rust bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 md:p-12 shadow-lg">
          <img
            src="/ironclad_founder_shield_logo.png"
            alt=""
            className="mx-auto mb-4 h-20 w-auto drop-shadow-md"
            aria-hidden="true"
          />
          <h3 className="mb-3 text-2xl md:text-3xl font-bold text-white">Lock in Founding Partner Pricing</h3>
          <p className="mb-6 text-zinc-300">Spots are limited per trade and county. Once your trade fills, founder pricing closes permanently.</p>
          <Link href="/apply">
            <Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white">
              Apply as a Founding Partner →
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-4xl font-bold text-white">Spots Remaining in Your Area</h2>
        {/* TODO: wire this to Supabase founder_spots table */}
        {/* Table needs: trade, county, tier, spots_total, spots_filled */}
        {/* Query: SELECT * FROM founder_spots WHERE county = 'Sumner' */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {spots.map(([county, trade, remaining]) => (
            <Card key={`${county}-${trade}`} className="border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-500">{county}</p>
              <h3 className="text-xl font-bold text-white">{trade}</h3>
              <p className="mt-2 text-lw-rust">{remaining} of 5 Preferred spots remaining</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Card className="border-lw-rust/40 bg-lw-rust/10 p-8">
          <Shield className="mb-4 h-8 w-8 text-lw-rust" />
          <p className="text-lg text-zinc-100 leading-relaxed">Founding Partners are held to the same IronClad Standards as all network members — and then some. Founding Partner status can be revoked for IronClad violations. We built this network on trust. We intend to keep it that way.</p>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-4xl font-bold text-white">FAQ</h2>
        <div className="space-y-4">{faqs.map(([q, a]) => <Card key={q} className="border-zinc-800 bg-zinc-950 p-6"><h3 className="mb-2 text-xl font-bold text-white">{q}</h3><p className="text-zinc-400 leading-relaxed">{a}</p></Card>)}</div>
      </section>

      <section className="container mx-auto px-4 py-20 text-center">
        <img
          src="/ironclad_founder_shield_logo.png"
          alt=""
          className="mx-auto mb-4 h-20 w-auto drop-shadow-md"
          aria-hidden="true"
        />
        <h2 className="mb-4 text-4xl font-bold text-white">Ready to Reserve Your Spot?</h2>
        <Link href="/apply"><Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white">Apply as a Founding Partner</Button></Link>
        <p className="mt-4 text-zinc-400">Applications are reviewed within 72 hours. Founding Partner pricing is only available after admin approval.</p>
      </section>
    </PageShell>
  );
}
