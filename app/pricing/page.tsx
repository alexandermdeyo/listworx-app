import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getContent, getSiteContent, isVisible } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const content = await getSiteContent('pricing');

  return (
    <PageShell surface="dark">
      <Navigation />
      {isVisible(content, 'pricing_banner_visible') && (
        <div className="bg-lw-rust px-4 py-3 text-center text-sm font-semibold text-white">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {getContent(content, 'pricing_banner_text', 'Founding Partner spots are open in Nashville and Sumner County. Limited per trade.')}
        </div>
      )}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">Simple Partner Pricing</h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400 mb-10">Flat membership pricing for contractors who want trusted referrals without lead-marketplace chaos.</p>
        <Card className="mx-auto max-w-lg p-8 bg-zinc-900 border-zinc-800 text-left">
          <h2 className="text-2xl font-bold text-white mb-2">Founding Partner</h2>
          <p className="text-zinc-400 mb-6">For approved contractors in open trades and counties.</p>
          <ul className="space-y-3 mb-8">
            {['No pay-per-lead fees', 'IronClad-certified positioning', 'Limited competition per request'].map(item => <li key={item} className="flex gap-3 text-zinc-300"><CheckCircle className="h-5 w-5 text-lw-rust" />{item}</li>)}
          </ul>
          <Link href="/apply"><Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">Apply for Pricing</Button></Link>
        </Card>
      </section>
    </PageShell>
  );
}
