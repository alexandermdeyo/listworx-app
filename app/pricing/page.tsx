import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';
import { CheckCircle } from 'lucide-react';

const standardPlans = [
  ['Basic Partner', '$199/month', ['Included in referral rotation', 'Basic contractor profile', 'Standard positioning', 'IronClad Standards required'], 'Apply Now'],
  ['Preferred Partner', '$349/month', ['Priority positioning in rotation', 'Enhanced contractor profile', 'Access to marketing add-on opportunities', 'IronClad Standards required'], 'Apply Now'],
  ['Elite Partner', '$599/month', ['Top of rotation in your trade and county', 'Territory lock (limited spots)', 'Featured in requestor referral cards', 'Eligible for ListWorx media partnerships', 'IronClad Standards required'], 'Apply Now — Limited Spots'],
];

const pricingRows = [
  ['Activation Fee', '$75 one-time', '$75 one-time', '$75 one-time'],
  ['Locked Monthly Rate', '$159/mo', '$279/mo', '$479/mo'],
  ['Standard Rate', '$199/month', '$349/month', '$599/month'],
  ['You Save', '$40/mo forever', '$70/mo forever', '$120/mo forever'],
  ['Spots Per County', '10 per trade', '5 per trade', '2 per trade'],
];

export default function PricingPage() {
  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="bg-lw-rust py-4 text-center text-white">
        <p className="font-semibold">⚡ Founding Partner spots are open in Nashville and Sumner County. Limited per trade. Reserve yours before your county fills. <a href="#founder" className="underline">See Founding Partner pricing →</a></p>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h1 className="mb-2 text-5xl font-bold text-white">Standard Contractor Pricing</h1>
        <p className="mb-8 text-zinc-400">For contractors joining after Founding Partner spots close.</p>
        <div className="grid gap-6 md:grid-cols-3">
          {standardPlans.map(([name, price, features, cta]) => (
            <Card key={name as string} className="border-zinc-800 bg-zinc-950 p-6">
              <h2 className="text-2xl font-bold text-white">{name}</h2>
              <p className="mb-5 mt-2 text-3xl font-bold text-lw-rust">{price}</p>
              <div className="mb-6 space-y-3">{(features as string[]).map(feature => <div key={feature} className="flex gap-2 text-zinc-300"><CheckCircle className="h-4 w-4 shrink-0 text-lw-rust" />{feature}</div>)}</div>
              <Link href="/apply"><Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">{cta}</Button></Link>
            </Card>
          ))}
        </div>
      </section>

      <section id="founder" className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-white">Founding Partner Pricing</h2>
        <p className="mb-6 text-zinc-400">Limited spots. When they're gone, this offer closes for good. Your rate locks in on day one — and nobody joining after you will ever see it again.</p>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[760px] bg-zinc-950 text-left text-sm">
            <thead><tr>{['', 'Basic Founder', 'Preferred Founder', 'Elite Founder'].map(h => <th key={h} className="p-4 text-white">{h}</th>)}</tr></thead>
            <tbody>{pricingRows.map(row => <tr key={row[0]} className="border-t border-zinc-800">{row.map((cell, i) => <td key={cell} className={`p-4 ${i === 0 ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="my-6 text-zinc-300">Standard pricing will not change for existing subscribers — but Founding Partner spots will close permanently once each trade fills per county. There is no second round.</p>
        <Link href="/founding-partner"><Button className="bg-amber-500 text-black hover:bg-amber-400">Reserve My Founding Partner Spot</Button></Link>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-white">Free for Realtors and Homeowners</h2>
        <p className="mx-auto my-5 max-w-2xl text-zinc-400">Job referrals are always free for realtors and homeowners. Always. That part never changes. Realtors who want access to Listing Studio — our marketing and content platform — can add that separately. More on that below.</p>
        <Link href="/request"><Button variant="outline" className="border-lw-rust text-lw-rust hover:bg-lw-rust hover:text-white">Request a Referral</Button></Link>
      </section>
    </PageShell>
  );
}
