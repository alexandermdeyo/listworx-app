'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navy brand header (redesign). Rendered by <Navigation variant="navy">, which
 * keeps owning all session / role / dashboard-routing logic and passes the
 * results in. Every link points at a page that already exists; unfinished
 * products are labelled "Coming Soon" and are not links.
 */

type NavLink = { label: string; href?: string; soon?: boolean };
type NavGroup = { label: string; items: NavLink[] };

function buildGroups(academyEnabled: boolean): NavGroup[] {
  return [
    {
      label: 'Find a Contractor',
      items: [
        { label: 'Request a Contractor', href: '/request' },
        { label: 'How It Works', href: '/#how-it-works' },
        { label: 'For Realtors', href: '/realtors' },
        { label: 'IronClad Standards', href: '/ironclad' },
      ],
    },
    {
      label: 'For Contractors',
      items: [
        { label: 'Why ListWorx', href: '/contractors' },
        { label: 'Apply to Join', href: '/apply' },
        { label: 'Pricing', href: '/pricing' },
        ...(academyEnabled ? [{ label: 'Academy', href: '/academy' }] : []),
      ],
    },
    {
      label: 'Manual Library',
      items: [
        { label: 'The Contractor Business Playbook', soon: true },
        { label: 'Learning Center', href: '/learning-center' },
      ],
    },
    {
      label: 'Business Tools',
      items: [
        { label: 'Calculators & Worksheets', soon: true },
        { label: 'Checklists & Forms', soon: true },
      ],
    },
    {
      label: 'Media Services',
      items: [
        { label: 'Media Services', href: '/media-services' },
        { label: 'Book a Shoot', href: '/media-services/book' },
        { label: 'Media Partners', href: '/media-partners' },
      ],
    },
    {
      label: 'Resources',
      items: [
        { label: 'Blog', href: '/blog' },
        { label: 'FAQ', href: '/faq' },
        { label: 'About', href: '/about' },
        { label: 'Faith & Purpose', href: '/faith-and-purpose' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ];
}

function MenuItem({ item, onNavigate }: { item: NavLink; onNavigate?: () => void }) {
  if (item.soon || !item.href) {
    return (
      <span className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-brand-ink/[0.55]">
        {item.label}
        <span className="br-soon">Coming Soon</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="block rounded-md px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-mist hover:text-brand-orange"
    >
      {item.label}
    </Link>
  );
}

interface Props {
  loggedIn: boolean;
  loading: boolean;
  dashboardHref: string | null;
  academyEnabled: boolean;
  onSignOut: () => void;
  tagline?: string;
}

export default function BrandNavBar({
  loggedIn,
  loading,
  dashboardHref,
  academyEnabled,
  onSignOut,
  tagline = 'IronClad Contractors · Trusted by Realtors · Chosen by Homeowners',
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groups = buildGroups(academyEnabled);

  return (
    <div className="border-b border-white/10 bg-brand-navy-deep text-white">
      <div className="container mx-auto flex h-[76px] items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="ListWorx home" className="flex shrink-0 flex-col justify-center">
          <img src="/brand/listworx-wordmark-dark.png" alt="ListWorx" className="h-6 w-auto md:h-8" />
          <span className="br-nav-font mt-1 hidden whitespace-nowrap text-[12px] leading-none text-white/80 2xl:block">{tagline}</span>
        </Link>

        <nav aria-label="Main" className="br-nav-font hidden items-center gap-0.5 lg:flex">
          {groups.map((g) => (
            <div
              key={g.label}
              className="group relative"
              onMouseLeave={() => setOpenGroup((cur) => (cur === g.label ? null : cur))}
            >
              <button
                type="button"
                aria-expanded={openGroup === g.label}
                onClick={() => setOpenGroup((cur) => (cur === g.label ? null : g.label))}
                onMouseEnter={() => setOpenGroup(g.label)}
                className="flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-[15px] font-medium text-white/90 hover:text-white xl:text-[17px] 2xl:px-3"
              >
                {g.label}
                <ChevronDown className="h-4 w-4 opacity-80" />
              </button>
              <div
                className={cn(
                  'absolute left-0 top-full z-50 min-w-[250px] pt-2 font-sans',
                  openGroup === g.label ? 'block' : 'hidden group-focus-within:block'
                )}
              >
                <div className="br-card p-2">
                  {g.items.map((item) => (
                    <MenuItem key={item.label} item={item} onNavigate={() => setOpenGroup(null)} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && loggedIn ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref} className="hidden items-center gap-2 whitespace-nowrap rounded-lg border border-white/60 px-3 py-2 text-sm font-semibold text-white hover:bg-white hover:text-brand-navy sm:inline-flex">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              )}
              <button type="button" onClick={onSignOut} className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/[0.85] hover:text-white sm:inline-flex">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden items-center gap-2 whitespace-nowrap rounded-lg border border-white/60 px-3 py-2 text-sm font-semibold text-white hover:bg-white hover:text-brand-navy sm:inline-flex">
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
              <Link href="/apply" className="hidden whitespace-nowrap rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-orange-hover sm:inline-flex">
                Join ListWorx
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-brand-navy-deep lg:hidden">
          <nav aria-label="Mobile" className="container mx-auto space-y-4 px-4 py-5">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="br-nav-font mb-1 text-sm font-semibold uppercase tracking-wider text-brand-orange">{g.label}</p>
                <div className="rounded-xl bg-white p-1">
                  {g.items.map((item) => (
                    <MenuItem key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {!loading && loggedIn ? (
                <>
                  {dashboardHref && (
                    <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="br-btn-outline-light flex-1 !py-2.5 text-sm">
                      Dashboard
                    </Link>
                  )}
                  <button type="button" onClick={onSignOut} className="br-btn-outline-light flex-1 !py-2.5 text-sm">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="br-btn-outline-light flex-1 !py-2.5 text-sm">
                    Sign In
                  </Link>
                  <Link href="/apply" onClick={() => setMobileOpen(false)} className="br-btn-primary flex-1 !py-2.5 text-sm">
                    Join ListWorx
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
