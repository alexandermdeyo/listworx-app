import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/design-system';
import { CheckCircle, Crown } from 'lucide-react';
import { Reveal } from '@/components/motion';

const foundingPlans = [
  {
    name: 'Basic Founder',
    price: '$159',
    highlight: false,
    extra: null as string | null,
  },
  {
    name: 'Preferred Founder',
    price: '$279',
    highlight: true,
    extra: 'Priority matching + higher referral volume',
  },
  {
    name: 'Elite Founder',
    price: '$479',
    highlight: false,
    extra: 'Top-priority matching + the highest referral volume',
  },
];

const BASE_FEATURES = [
  'IronClad Verified badge',
  'Profile on the ListWorx platform',
  'Access to homeowner referrals',
  'Verified reviews system',
  'Availability & service-area controls',
];

const standardPlans = [
  ['Basic Partner', '$199/month', ['Included in referral rotation', 'Basic contractor profile', 'Standard positioning', 'IronClad Standards required', 'ListWorx Academy access — including ACES Licensing and Exam Prep'], 'Apply Now'],
  ['Preferred Partner', '$349/month', ['Priority positioning in rotation', 'Enhanced contractor profile', 'Access to marketing add-on opportunities', 'IronClad Standards required', 'Full ListWorx Academy access — ACES licensing resources and ACES Trained badge on your profile'], 'Apply Now'],
  ['Elite Partner', '$599/month', ['Top of rotation in your trade and county', 'Territory lock (limited spots)', 'Featured in requestor referral cards', 'Eligible for ListWorx media partnerships', 'IronClad Standards required', 'Full ListWorx Academy access — ACES licensing resources, ACES Trained badge, and priority course placement'], 'Apply Now — Limited Spots'],
];

export default function PricingPage() {
  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />
      <section className="bg-lw-rust py-4 text-center text-white">
        <p className="font-semibold">⚡ Founding Partner spots are open in Nashville and Sumner County. Limited per trade. When they&apos;re gone, they&apos;re gone.</p>
      </section>

      <section className="container mx-auto px-4 pt-16 pb-8 text-center">
        <Badge className="bg-lw-rust/15 text-lw-rust border-lw-rust/30 mb-4">
          <Crown className="h-3 w-3 mr-1" />
          Founding Member Pricing
        </Badge>
        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-mkt-ink">Founding Partner Pricing</h1>
        <p className="mx-auto max-w-2xl text-mkt-ink/70 text-lg">
          One-time $75 activation fee covers your IronClad Verified business review — entity, license, and insurance. Your monthly rate locks in the day you join and stays locked for as long as you&apos;re an active member. You will never be moved to the post-launch rate.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {foundingPlans.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 70} pulse={plan.highlight}>
              <Card
                className={`lw-hover-lift relative flex h-full flex-col bg-white text-mkt-ink shadow-sm p-6 ${
                  plan.highlight ? 'border-2 border-lw-rust shadow-lg' : 'border-zinc-200'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lw-rust px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </span>
                )}
                <Badge className="mb-4 w-fit bg-mkt-navy/10 text-mkt-navy border-mkt-navy/20">
                  Founding Member
                </Badge>
                <h2 className="text-2xl font-bold text-mkt-ink">{plan.name}</h2>
                <p className="mb-1 mt-2 text-3xl font-bold text-lw-rust">
                  {plan.price}<span className="text-base font-semibold text-mkt-ink/60">/mo</span>
                </p>
                <p className="mb-5 text-xs text-mkt-ink/60">+ $75 one-time activation fee</p>
                <div className="mb-4 space-y-3 flex-1">
                  {BASE_FEATURES.map(feature => (
                    <div key={feature} className="flex gap-2 text-mkt-ink/80 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-lw-rust mt-0.5" />
                      {feature}
                    </div>
                  ))}
                  {plan.extra && (
                    <div className="flex gap-2 text-mkt-ink font-semibold text-sm pt-1 border-t border-zinc-100 mt-3">
                      <CheckCircle className="h-4 w-4 shrink-0 text-lw-rust mt-0.5" />
                      {plan.extra}
                    </div>
                  )}
                </div>
                <Link href="/founding-partner">
                  <Button className={`w-full text-white ${plan.highlight ? 'bg-lw-rust hover:bg-lw-rust-hover' : 'bg-mkt-navy hover:bg-mkt-navy/90'}`}>
                    Claim This Spot
                  </Button>
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-mkt-ink/60">
          Founding slots are limited per trade, per county. Once they&apos;re gone, this pricing is gone with them — new contractors join at the standard rate below.
        </p>
      </section>

      <section className="bg-zinc-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-mkt-ink">Standard Pricing — After Founding Spots Close</h2>
          <p className="mb-8 text-center text-mkt-ink/70">For contractors joining after Founding Partner spots close in their county.</p>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {standardPlans.map(([name, price, features, cta], index) => (
              <Reveal key={name as string} delay={index * 70}>
                <Card className="bg-white text-mkt-ink shadow-sm p-6 border-zinc-200">
                  <h3 className="text-xl font-bold text-mkt-ink">{name}</h3>
                  <p className="mb-5 mt-2 text-2xl font-bold text-mkt-ink/80">{price}</p>
                  <div className="mb-6 space-y-3">{(features as string[]).map(feature => <div key={feature} className="flex gap-2 text-mkt-ink/70 text-sm"><CheckCircle className="h-4 w-4 shrink-0 text-mkt-ink/40 mt-0.5" />{feature}</div>)}</div>
                  <Link href="/apply"><Button variant="outlineOrange" className="w-full">{cta}</Button></Link>
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
            <p className="mx-auto my-5 max-w-2xl text-white/70">Job referrals are always free for realtors and homeowners. Always. That part never changes. Realtors who want access to Listing Studio — our marketing and content platform — can add that separately. More on that below.</p>
            <Link href="/request"><Button variant="outlineOrange">Request a Referral</Button></Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
