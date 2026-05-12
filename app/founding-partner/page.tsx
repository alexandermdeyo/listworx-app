import Link from 'next/link';
import { Crown, Shield, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getContent, getSiteContent, isVisible } from '@/lib/site-content';

export const dynamic = 'force-dynamic';

export default async function FoundingPartnerPage() {
  const content = await getSiteContent('founding_partner');

  if (!isVisible(content, 'fp_visible')) {
    return (
      <PageShell surface="dark">
        <Navigation />
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold text-white">Founding Partner enrollment is currently closed.</h1>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell surface="dark">
      <Navigation />
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-amber-600/15 text-amber-500 border-amber-600/30"><Crown className="h-3 w-3 mr-1" /> Limited founding opportunity</Badge>
          <h1 className="mx-auto max-w-4xl text-4xl md:text-6xl font-bold text-white mb-6">
            {getContent(content, 'fp_hero_headline', 'Become a Founding Partner')}
          </h1>
          <p className="mx-auto max-w-3xl text-lg md:text-xl text-zinc-400 leading-relaxed mb-10">
            {getContent(content, 'fp_hero_subheadline', 'This is not a discount. This is a founder opportunity. A limited number of contractors will lock in permanent pricing, territory reservation, and Founding Partner status before we open to the public.')}
          </p>
          <Link href="/apply"><Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white px-8">Apply to Join <ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
        </div>
      </section>
      <section className="py-16 bg-lw-dark">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6">
          {['Permanent founder recognition', 'Limited trade availability', 'IronClad network placement'].map(item => (
            <Card key={item} className="p-6 bg-zinc-900 border-zinc-800 text-center">
              <Shield className="h-8 w-8 text-lw-rust mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white">{item}</h2>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
