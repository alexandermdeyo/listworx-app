'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <Navigation />

      {/* HERO */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="mx-auto text-center" style={{ maxWidth: '820px' }}>
            <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-5">
              About ListWorx
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              Built to Fix What's Broken in Home Services
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10">
              ListWorx connects homeowners and realtors with contractors who are vetted, accountable, and ready to do the job right.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contractor-portal">
                <Button size="lg" className="bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-8">
                  Apply as a Contractor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 font-semibold px-8">
                  Request a Contractor — Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
        <div className="border-t border-zinc-800" />
      </div>

      {/* FOUNDER STORY */}
      <section className="py-20 md:py-28">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="mx-auto" style={{ maxWidth: '760px' }}>
            <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-5">
              The Founder
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 leading-tight">
              Why I Built This
            </h2>
            <div className="space-y-6 text-lg text-zinc-400 leading-[1.85]">
              <p>I didn't build ListWorx from a boardroom. I built it from real life.</p>
              <p>
                I'm an Air Force veteran, truck driver, former chef, photographer, business owner, and someone who has worked around homes, contractors, and real estate from more than one angle. I've seen what happens when people don't show up, don't communicate, and don't take pride in their work. I've also seen what happens when good people get overlooked because there's no better system in place.
              </p>
              <p>
                I've seen contractors struggle to get steady work. I've seen homeowners take risks and regret it. I've seen realtors deal with the fallout when the wrong person gets trusted with the job.
              </p>
              <p>
                That's why I built ListWorx. Not to create another lead marketplace. Not to become another noisy directory. But to build a better system. A system with standards. A system that rewards the people who do things right.
              </p>
              <p>
                I moved to Tennessee not just for a better quality of life, but to build this company in a place where I can grow it the right way. Nashville is the starting point. The vision is much bigger. I want to build something here that can scale across the country and help people everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
        <div className="border-t border-zinc-800" />
      </div>

      {/* WHY LISTWORX EXISTS + IRONCLAD */}
      <section className="py-20 md:py-28">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="mx-auto" style={{ maxWidth: '760px' }}>
            <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-5">
              The Mission
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
              A Better System. Real Standards.
            </h2>
            <div className="space-y-5 text-lg text-zinc-400 leading-[1.85]">
              <p>
                The home services industry runs on trust — but it's built on almost none. Contractors disappear. Reviews get gamed. Nobody's accountable after the check clears.
              </p>
              <p>
                ListWorx exists to change that. Every contractor in our network is vetted for licensing, insurance, and professionalism before they're ever seen by a client. That's not a feature — it's the foundation.
              </p>
              <p>
                IronClad Standards is the framework that makes it real. It defines what we expect, how performance is measured, and what happens when those standards aren't met. Contractors who maintain the standard earn more trust, more visibility, and more work. Those who don't are removed.
              </p>
            </div>
            <div className="mt-10">
              <Link href="/ironclad">
                <Button variant="outline" className="border-zinc-600 text-white hover:border-[#f97316] hover:text-[#f97316] hover:bg-transparent">
                  <Shield className="mr-2 h-4 w-4" />
                  Read the IronClad Standards
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
        <div className="border-t border-zinc-800" />
      </div>

      {/* WHO IT'S FOR */}
      <section className="py-20 md:py-28">
        <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
          <div className="mx-auto text-center mb-14" style={{ maxWidth: '600px' }}>
            <p className="text-[#f97316] text-sm font-semibold uppercase tracking-widest mb-5">
              Who This Is Built For
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Three groups. One standard.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {[
              {
                audience: 'Realtors',
                body: 'Protect your reputation and close deals with confidence. When you refer a contractor, it reflects on you. We make sure that reflection is a good one.',
                href: '/realtors',
                cta: 'Learn more',
              },
              {
                audience: 'Homeowners',
                body: 'Stop guessing. Get connected to contractors who are actually vetted — no lead farms, no anonymous bids, no surprises.',
                href: '/request',
                cta: 'Request a contractor',
              },
              {
                audience: 'Contractors',
                body: 'Get consistent, quality work without fighting for scraps. Join a network where professionalism is rewarded and your reputation builds over time.',
                href: '/contractor-portal',
                cta: 'Apply to join',
              },
            ].map(item => (
              <div
                key={item.audience}
                className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col"
              >
                <div className="text-[#f97316] font-bold text-xs uppercase tracking-widest mb-4">
                  {item.audience}
                </div>
                <p className="text-zinc-300 text-base leading-relaxed mb-6 flex-1">{item.body}</p>
                <Link
                  href={item.href}
                  className="text-sm text-[#f97316] font-semibold hover:underline inline-flex items-center gap-1.5"
                >
                  {item.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
        <div className="border-t border-zinc-800" />
      </div>

      {/* FINAL CTA */}
      <section className="py-24 md:py-32">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: '1200px' }}>
          <div className="mx-auto" style={{ maxWidth: '680px' }}>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
              Ready to be part of something built right?
            </h2>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
              Whether you're a contractor who's tired of chasing leads, or a homeowner who's tired of guessing — this is for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contractor-portal">
                <Button size="lg" className="bg-[#f97316] hover:bg-orange-600 text-white font-semibold px-8">
                  Apply as a Contractor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 font-semibold px-8">
                  Request a Contractor — Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
