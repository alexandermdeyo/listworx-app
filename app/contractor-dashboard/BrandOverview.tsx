'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, FileCheck2, Inbox, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import Brushstroke from '@/components/brand/Brushstroke';
import PhotoBlend from '@/components/brand/PhotoBlend';

/**
 * Brand redesign: hero, KPI row, and quick links for the contractor dashboard
 * overview. Display only. Every number shown is the contractor's real data:
 *  - referrals this month: my_referral_tally() (same counts-only RPC as ReferralTally)
 *  - membership tier: contractor_profiles.tier
 *  - license / insurance: the same expiry dates the warning banners use
 * Nothing here writes data or changes any flow.
 */

type Props = {
  tier: string | null;
  licenseDaysUntil: number | null;
  insuranceDaysUntil: number | null;
  onOpenDocuments: () => void;
};

function expiryLabel(days: number | null) {
  if (days === null) return { value: 'Not on file', sub: 'Upload in Documents', warn: true };
  if (days < 0) return { value: 'Expired', sub: `${Math.abs(days)} days ago`, warn: true };
  if (days <= 30) return { value: `${days} days`, sub: 'Until expiration', warn: true };
  return { value: 'Current', sub: `${days} days until renewal`, warn: false };
}

export function BrandDashboardHero() {
  return (
    <section className="relative isolate -mx-6 -mt-6 overflow-hidden bg-brand-navy text-white">
      <PhotoBlend
        src="/images/redesign/contractor_painter-wall-crop.webp"
        side="right"
        priority
        className="md:left-[45%]"
        imgClassName="object-[70%_30%]"
      />
      <div className="relative z-10 px-6 py-10 md:px-10 md:py-12">
        <p className="text-lg font-medium text-white/90">Contractor Dashboard</p>
        <h2 className="br-display mt-2 text-3xl leading-[1.05] md:text-5xl">
          Grow Your Business
          <span className="block">with ListWorx</span>
        </h2>
        <Brushstroke variant="underline" className="mt-3 h-3 w-56 md:w-72" />
        <p className="mt-4 max-w-xl text-base text-white/90 md:text-lg">
          Your referrals, profile, documents, and business tools, all in one place.
        </p>
      </div>
    </section>
  );
}

export function BrandKpiRow({ tier, licenseDaysUntil, insuranceDaysUntil, onOpenDocuments }: Props) {
  const [monthReferrals, setMonthReferrals] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .rpc('my_referral_tally')
      .then(({ data, error }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (error || !row) {
          setFailed(true);
          return;
        }
        setMonthReferrals(Number(row.this_month) || 0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const license = expiryLabel(licenseDaysUntil);
  const insurance = expiryLabel(insuranceDaysUntil);

  const cards = [
    {
      icon: Inbox,
      label: 'Referrals',
      value: failed ? 'Unavailable' : monthReferrals === null ? '…' : String(monthReferrals),
      sub: 'This month',
      warn: false,
    },
    {
      icon: BadgeCheck,
      label: 'Membership',
      value: tier ? tier.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Not set',
      sub: tier ? 'Plan on file' : 'See Subscription below',
      warn: false,
    },
    { icon: FileCheck2, label: 'License', ...license, onClick: onOpenDocuments },
    { icon: ShieldCheck, label: 'Insurance', ...insurance, onClick: onOpenDocuments },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const inner = (
          <>
            <Icon className="h-9 w-9 shrink-0 text-brand-orange" strokeWidth={1.6} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-ink/80">{c.label}</p>
              <p className={`br-display truncate text-2xl md:text-3xl ${c.warn ? 'text-red-700' : 'text-brand-ink'}`}>{c.value}</p>
              <p className="text-xs text-brand-ink/60 md:text-sm">{c.sub}</p>
            </div>
          </>
        );
        return 'onClick' in c && c.onClick ? (
          <button key={c.label} type="button" onClick={c.onClick} className="br-card flex items-center gap-4 p-4 text-left transition-shadow hover:shadow-lg md:p-5">
            {inner}
          </button>
        ) : (
          <div key={c.label} className="br-card flex items-center gap-4 p-4 md:p-5">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

const quickLinks = [
  { label: 'View Referrals', href: '#referrals', img: '/images/redesign/results_house-exterior-dusk.webp' },
  { label: 'Build a Flyer', href: '/contractor-dashboard/flyers', img: '/images/redesign/contractor_cleaning-crew.webp' },
  { label: 'Learning Center', href: '/learning-center', img: '/images/redesign/about_contractor-realtor-handshake.webp' },
  { label: 'Request Media Services', href: '/media-services', img: '/images/redesign/contractor_video-crew-content-shoot.webp' },
];

export function BrandQuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {quickLinks.map((q) => (
        <Link
          key={q.label}
          href={q.href}
          className="group relative isolate flex h-32 items-end overflow-hidden rounded-2xl bg-brand-navy p-4 shadow-[0_14px_34px_-22px_rgba(15,35,66,0.6)] md:h-40 md:p-5"
        >
          <img src={q.img} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-navy via-brand-navy/75 to-brand-navy/10" />
          <span className="br-display flex items-center gap-2 text-lg leading-tight text-white md:text-xl">
            {q.label} <ArrowRight className="h-5 w-5 shrink-0 text-brand-orange" />
          </span>
        </Link>
      ))}
    </div>
  );
}
