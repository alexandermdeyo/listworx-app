import Link from 'next/link';
import { ShieldCheck, Search, ClipboardCheck, Star, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import HomeownerHero from '@/components/site/HomeownerHero';

const whyListworx = [
  {
    icon: ShieldCheck,
    title: 'Verified Pros Only',
    body: 'Every contractor on ListWorx has passed IronClad Verified — we confirm their business license, insurance, and entity before they ever receive a referral.',
  },
  {
    icon: Search,
    title: 'We Do the Matching',
    body: 'You describe the job. Our system matches you to the right verified contractor for your trade, area, and timeline. No scrolling through profiles. No wondering who to call.',
  },
  {
    icon: Star,
    title: 'Real Accountability',
    body: "ListWorx contractors are rated by real verified homeowners after confirmed jobs. If a contractor doesn't maintain standards, they don't stay on the platform.",
  },
];

const howItWorks = [
  {
    icon: ClipboardCheck,
    title: 'Describe your project',
    body: 'Tell us what you need and where.',
  },
  {
    icon: Search,
    title: 'Get matched',
    body: 'We connect you with a verified contractor in your area who handles that work.',
  },
  {
    icon: ShieldCheck,
    title: 'Get it done',
    body: 'Your contractor reaches out, the job gets scheduled, it gets done right.',
  },
];

export default function LandingPage() {
  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      <HomeownerHero />

      <section className="bg-mkt-navy py-16 md:py-20">
        <div className="container mx-auto px-4">
          <Reveal as="h2" className="mb-10 text-center text-2xl md:text-3xl font-bold text-white">
            Why ListWorx
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {whyListworx.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 70}>
                  <Card className="border-white/15 bg-white/[0.07] shadow-xl backdrop-blur-sm p-6 h-full">
                    <Icon className="mb-4 h-8 w-8 text-lw-rust" />
                    <h3 className="mb-3 text-xl font-bold text-white">{item.title}</h3>
                    <p className="text-white/70 leading-relaxed text-sm">{item.body}</p>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container mx-auto px-4 py-16 md:py-20 scroll-mt-24">
        <Reveal as="h2" className="mb-12 text-center text-3xl md:text-4xl font-bold text-mkt-ink">
          How It Works
        </Reveal>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {howItWorks.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 100} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lw-rust/10 text-lw-rust">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mb-1 text-xs font-semibold uppercase tracking-widest text-lw-rust">Step {index + 1}</span>
                <h3 className="mb-2 text-lg font-bold text-mkt-ink">{step.title}</h3>
                <p className="text-mkt-ink/70 text-sm">{step.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bg-mkt-ink py-16">
        <div className="container mx-auto px-4">
          <Reveal as="div" className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="mb-2 text-2xl md:text-3xl font-bold text-white">Working in Real Estate?</h2>
              <p className="text-white/70 max-w-xl">
                ListWorx helps real estate professionals connect their clients with verified contractors for pre-listing prep, inspections, repairs, and move-in work — fast, reliable, and professionally verified.
              </p>
            </div>
            <Link href="/realtors" className="shrink-0">
              <Button size="lg" variant="outlineOrange">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      <Reveal as="section" className="bg-lw-rust py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-3 text-2xl md:text-3xl font-bold text-white">Are You a Contractor?</h2>
          <p className="mx-auto mb-8 max-w-xl text-white/90">
            ListWorx is accepting verified contractors in your area. Founding spots are limited. Subscription-based — no per-lead fees.
          </p>
          <Link href="/apply">
            <Button size="lg" className="bg-white text-lw-rust hover:bg-white/90">
              Apply to Join
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Reveal>
    </PageShell>
  );
}
