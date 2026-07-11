'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEMO_ROLE_CARDS, type DemoRoleCard } from '@/lib/demo/acesDemoData';
import { Building2, Users, ShieldCheck, ArrowRight, Globe } from 'lucide-react';

const ROLE_ICONS: Record<DemoRoleCard['id'], React.ElementType> = {
  contractor: Building2,
  requestor: Users,
  aces_partner: ShieldCheck,
};

const EXPLORE_LINKS = [
  { label: 'ListWorx Home', href: 'https://listworx.co' },
  { label: 'ListWorx Academy', href: 'https://listworx.co/academy' },
  { label: 'ACES Partnership Page', href: 'https://listworx.co/partners/aces' },
];

export default function AcesDemoHomePage() {
  return (
    <div className="min-h-screen bg-lw-dark text-lw-light">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex justify-center mb-8">
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lw-orange" />
            Demo Mode
          </Badge>
        </div>

        <div className="mx-auto max-w-2xl text-center mb-14">
          <p className="lw-label mb-3">ListWorx &times; ACES</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-balance">
            A walkthrough built for ACES
          </h1>
          <p className="text-base md:text-lg lw-muted">
            This preview was put together for ACES to show how the ListWorx platform works day to day —
            for contractors, for the realtors and homeowners requesting work, and for ACES as a partner.
            Everything below runs on sample data, so feel free to click around.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {DEMO_ROLE_CARDS.map((card) => {
            const Icon = ROLE_ICONS[card.id];
            return (
              <Link key={card.id} href={card.href} className="group block h-full">
                <Card className="h-full p-8 transition-all hover:border-lw-rust hover:-translate-y-1">
                  <div className="h-12 w-12 rounded-xl bg-lw-rust/15 flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-lw-rust" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                  <p className="text-sm lw-muted mb-6">{card.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-lw-rust">
                    Enter demo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Card>
              </Link>
            );
          })}

          <Card className="h-full p-8" style={{ borderColor: '#1B2A4A', borderWidth: '2px' }}>
            <div className="h-12 w-12 rounded-xl bg-[#1B2A4A]/15 flex items-center justify-center mb-6">
              <Globe className="h-6 w-6" style={{ color: '#1B2A4A' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2">Explore ListWorx</h2>
            <p className="text-sm lw-muted mb-6">
              Browse the live ListWorx website as a visitor would — including the Academy page featuring ACES and the official partnership page.
            </p>
            <div className="flex flex-col gap-2">
              {EXPLORE_LINKS.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    {link.label}
                  </Button>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
