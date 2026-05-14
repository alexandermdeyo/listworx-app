import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';
import { CheckCircle, XCircle } from 'lucide-react';
import { FOUNDER_TIERS, STANDARD_TIERS } from '@/lib/tiers-config';

const comparisonRows = [
  ['Referral Rotation', 'Standard', 'Priority', 'Top Always'],
  ['Territory Lock', '—', '—', '✓ (2 spots)'],
  ['Monthly Performance Report', '+$29/mo', 'Included', 'Included'],
  ['IronClad Digital Badge Kit', '+$29', 'Included', 'Included'],
  ['Profile Boost', '+$49/mo', '1/quarter', 'Monthly'],
  ['Social Media Content (2 posts)', '+$99/mo', '+$99/mo', 'Included'],
  ['Google Business Optimization', '+$149', '+$149', 'Included'],
  ['Decal Package', '$99', '$79', '$49'],
];

const founderRows = [
  { label: 'Activation Fee', getValue: () => '$149 one-time' },
  { label: 'First 12 Months', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => tier.firstYear },
  { label: 'Renewal Rate', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.renewalRate}/month` },
  { label: 'Standard Rate', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.standardRate}/month` },
  { label: 'You Save', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.savingsMonthly}/mo forever` },
  { label: 'Annual Savings', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `$${tier.savingsAnnual}/year` },
  { label: 'Spots Per County', getValue: (tier: (typeof FOUNDER_TIERS)[number]) => `${tier.spotsPerCounty} per trade` },
];

export default function PricingPage() {
  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="bg-lw-rust py-4 text-center text-white">
        <p className="font-semibold">⚡ Founding Partner spots are open in Nashville and Sumner County. Limited per trade. Reserve yours before your county fills. <a href="#founder" className="underline">See Founding Partner pricing →</a></p>
      </section>

      <section className="relative overflow-hidden py-16">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="mb-2 text-5xl font-bold text-white">Standard Contractor Pricing</h1>
          <p className="mb-8 text-zinc-100">For contractors joining after Founding Partner spots close.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {STANDARD_TIERS.map((tier) => (
              <Card key={tier.id} className={`relative border-zinc-800 bg-zinc-950 p-6 ${tier.highlighted ? 'ring-2 ring-lw-rust' : ''}`}>
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lw-rust px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white">{tier.name}</h2>
                <p className="mt-3 text-zinc-300">{tier.description}</p>
                <div className="my-6">
                  <p className="text-4xl font-bold text-lw-rust">${tier.monthlyPrice}<span className="text-base text-zinc-400">/month</span></p>
                  <p className="mt-1 text-sm text-zinc-400">${tier.annualPrice}/year billed annually — about ${tier.annualMonthly}/mo</p>
                </div>
                {tier.territoryLock && (
                  <div className="mb-5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                    Limited spots — 2 per trade per county
                  </div>
                )}
                <div className="mb-6 space-y-3">
                  {tier.included.map((feature) => (
                    <div key={feature} className="flex gap-2 text-zinc-200">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {tier.notIncluded.map((feature) => (
                    <div key={feature} className="flex gap-2 text-zinc-500">
                      <XCircle className="h-4 w-4 shrink-0 text-zinc-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/apply"><Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">Apply Now</Button></Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="founder" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white">Founding Partner Pricing</h2>
        <p className="mb-6 text-zinc-400">Limited spots. Permanent price lock. First year included.</p>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[900px] bg-zinc-950 text-left text-sm">
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
              <tr className="border-t border-zinc-800 align-top">
                <td className="p-4 font-semibold text-zinc-200">What&apos;s Included</td>
                {FOUNDER_TIERS.map((tier) => (
                  <td key={tier.id} className="p-4 text-zinc-400">
                    <ul className="space-y-2">
                      {tier.included.map((item) => <li key={item}>• {item}</li>)}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="my-6 text-zinc-300">Standard pricing will not change for existing subscribers — but Founding Partner spots will close permanently once each trade fills per county. There is no second round.</p>
        <Link href="/founding-partner"><Button className="bg-amber-500 text-black hover:bg-amber-400">Reserve My Founding Partner Spot</Button></Link>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-4xl font-bold text-white">What&apos;s Included at Each Tier</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[760px] bg-zinc-950 text-left text-sm">
            <thead>
              <tr>
                {['Feature', 'Basic', 'Preferred', 'Elite'].map((heading) => <th key={heading} className="p-4 text-white">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, basic, preferred, elite]) => (
                <tr key={feature} className="border-t border-zinc-800">
                  <td className="p-4 font-semibold text-zinc-200">{feature}</td>
                  <td className="p-4 text-zinc-400">{basic}</td>
                  <td className="p-4 text-zinc-400">{preferred}</td>
                  <td className="p-4 text-zinc-400">{elite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-white">Free for Realtors and Homeowners</h2>
        <p className="mx-auto my-5 max-w-2xl text-zinc-400">ListWorx is always free for requestors. Submit a job request, receive three vetted referrals, connect directly with your contractor. No account required.</p>
        <Link href="/request"><Button variant="outline" className="border-lw-rust text-lw-rust hover:bg-lw-rust hover:text-white">Request a Referral</Button></Link>
      </section>
    </PageShell>
  );
}
