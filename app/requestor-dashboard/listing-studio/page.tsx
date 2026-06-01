'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { ListingStudio } from '@/components/listing-studio/ListingStudio';
import { SubscriptionCards } from '@/components/listing-studio/SubscriptionCards';
import type { RealtorProfile } from '@/components/listing-studio/SubscriptionCards';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase-browser';
import {
  LayoutDashboard,
  User as User2,
  Users,
  Plus,
  ClipboardList,
  Settings,
  Sparkles,
  Palette,
  Loader2,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'listing-studio', label: 'Listing Studio', icon: Sparkles,        href: '/requestor-dashboard/listing-studio' },
  { id: 'my-profile',     label: 'My Profile',     icon: User2,           href: '/requestor-dashboard/profile' },
  { id: 'my-brand',       label: 'My Brand',       icon: Palette,         href: '/requestor-dashboard/brand' },
  { id: 'vendors',        label: 'My Vendors',     icon: Users,           href: '/requestor-dashboard/vendors' },
  { id: 'submit',         label: 'Submit Request', icon: Plus,            href: '/request' },
  { id: 'requests',       label: 'My Requests',    icon: ClipboardList,   href: '/requestor-dashboard' },
  { id: 'settings',       label: 'Settings',       icon: Settings,        disabled: true },
];

// ─── Sample output data (Nashville listing) ───────────────────────────────────

const SAMPLE_TABS = [
  {
    id: 'instagram',
    label: 'Instagram Caption',
    content: `That covered back porch alone is worth the drive out to Hendersonville. 🏡

4 bed | 3 bath | 2,340 sqft | $489,000
412 Maple Creek Drive, Hendersonville TN

Corner lot, open floor plan, primary suite on main — and Sumner County schools within minutes. This one checks every box.

DM me to schedule a showing before it's gone.

#HendersonvilleHomes #NashvilleRealEstate #JustListed #SumnerCounty #ListWorx`,
  },
  {
    id: 'facebook',
    label: 'Facebook Post',
    content: `Just Listed in Hendersonville — and this one moves fast.

412 Maple Creek Drive is a 4-bedroom, 3-bath home with 2,340 square feet of thoughtfully designed space. Built in 2018, it features quartz countertops, hardwood floors, a gas fireplace, and a covered back porch made for Tennessee evenings.

Corner lot. Open floor plan. Primary suite on the main level. Top-rated Sumner County schools around the corner.

Listed at $489,000.

Drop a comment or send me a message to schedule your private showing.`,
  },
  {
    id: 'description',
    label: 'Property Description',
    content: `Welcome to 412 Maple Creek Drive — a move-in ready 4-bedroom, 3-bathroom home nestled on a corner lot in one of Hendersonville's most sought-after neighborhoods.

Built in 2018, this 2,340 square foot home combines modern finishes with everyday livability. The open floor plan flows from a chef-inspired kitchen — complete with quartz countertops, stainless appliances, and a gas fireplace — to a bright and airy living space perfect for entertaining.

The primary suite on the main level offers a private retreat, while three additional bedrooms provide flexibility for family, guests, or a home office. Step outside to a covered back porch overlooking the corner lot — your own slice of Tennessee outdoor living.

Priced at $489,000. Homes like this don't last — schedule your showing today.`,
  },
  {
    id: 'email',
    label: 'Email to Buyer List',
    content: `Subject: New Listing Alert — 4BR in Hendersonville, $489K

Hi [First Name],

I wanted to make sure you saw this one before it hits the weekend rush.

412 Maple Creek Drive just hit the market in Hendersonville at $489,000.

Here's what makes it stand out:
• 4 bed / 3 bath / 2,340 sqft — built in 2018
• Primary suite on the main level
• Open floor plan with quartz countertops and hardwood floors
• Covered back porch on a corner lot
• Top-rated Sumner County schools, close to Drakes Creek Park

Reply to this email or call me directly and I'll get something on the calendar.

[Realtor Name]
[Brokerage]
[Phone]`,
  },
] as const;

type SampleTabId = (typeof SAMPLE_TABS)[number]['id'];

// ─── Sample output section (for STATE A upsell) ───────────────────────────────

function SampleOutputSection() {
  const [activeTab, setActiveTab] = useState<SampleTabId>('instagram');
  const [copiedTab, setCopiedTab] = useState<SampleTabId | null>(null);

  const activeContent = SAMPLE_TABS.find((t) => t.id === activeTab)!.content;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopiedTab(activeTab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {}
  }

  return (
    <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">Real Output. Real Listing.</p>
        <h3 className="text-lg font-bold text-white">See What ListWorx Generates</h3>
        <p className="text-sm text-zinc-400 mt-1">Here's a real sample for a Nashville listing — generated in seconds.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto p-3 pb-0 border-b border-zinc-800">
        {SAMPLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-xs font-medium transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-amber-400 text-zinc-900 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
            {SAMPLE_TABS.find((t) => t.id === activeTab)!.label}
          </p>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
              copiedTab === activeTab
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700'
            }`}
          >
            {copiedTab === activeTab ? (
              <><Check className="h-3.5 w-3.5" />Copied!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" />Copy</>
            )}
          </button>
        </div>
        <pre className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
          {activeContent}
        </pre>
      </div>
    </div>
  );
}

// ─── Brand kit bar ────────────────────────────────────────────────────────────

type BrandKit = {
  display_name: string | null;
  brokerage_name: string | null;
  headshot_url: string | null;
};

function BrandKitBar({ brandKit }: { brandKit: BrandKit | null }) {
  if (!brandKit?.display_name && !brandKit?.brokerage_name) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
        <span>
          Add your brand details for more personalized content.{' '}
          <Link href="/requestor-dashboard/brand" className="font-semibold underline hover:text-amber-900">
            Set up My Brand →
          </Link>
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      {brandKit.headshot_url ? (
        <img
          src={brandKit.headshot_url}
          alt={brandKit.display_name || 'Headshot'}
          className="h-9 w-9 rounded-full object-cover border border-gray-200 shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-gray-500">
            {(brandKit.display_name || 'A')[0].toUpperCase()}
          </span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{brandKit.display_name}</p>
        {brandKit.brokerage_name && (
          <p className="text-xs text-gray-500 truncate">{brandKit.brokerage_name}</p>
        )}
      </div>
      <span className="ml-auto text-xs text-gray-400 shrink-0">Brand connected ✓</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingStudioPage() {
  const supabaseRef  = useRef(createClient());
  const [userName, setUserName]         = useState('');
  const [loading, setLoading]           = useState(true);
  const [realtorProfile, setRealtorProfile] = useState<RealtorProfile | null>(null);
  const [brandKit, setBrandKit]         = useState<BrandKit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseRef.current.auth.getUser();
      if (user?.email) setUserName(user.email.split('@')[0]);

      // Fetch dashboard data (includes realtorProfile)
      const res  = await fetch('/api/requestor-dashboard', { cache: 'no-store' });
      const data = await res.json();
      if (data?.realtorProfile) setRealtorProfile(data.realtorProfile);

      // Fetch brand kit
      const bkRes  = await fetch('/api/realtor/brand-kit');
      const bkData = await bkRes.json();
      if (bkData?.brandKit) {
        setBrandKit({
          display_name:   bkData.brandKit.display_name   || null,
          brokerage_name: bkData.brandKit.brokerage_name || null,
          headshot_url:   bkData.brandKit.headshot_url   || null,
        });
      }
    } catch (e) {
      console.error('[listing-studio/page] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleLogout() {
    try { await supabaseRef.current.auth.signOut({ scope: 'global' }); } catch {}
    window.location.href = '/login';
  }

  const isActive = realtorProfile?.listing_studio_status === 'active';

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout
        userName={userName || 'User'}
        pageTitle="LISTING STUDIO"
        navItems={NAV_ITEMS}
        activeNavId="listing-studio"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading Listing Studio...
        </div>
      </DashboardLayout>
    );
  }

  // ── STATE A — No active subscription ──────────────────────────────────────

  if (!isActive) {
    return (
      <DashboardLayout
        userName={userName || 'User'}
        pageTitle="LISTING STUDIO"
        navItems={NAV_ITEMS}
        activeNavId="listing-studio"
        onLogout={handleLogout}
      >
        <div className="p-6 max-w-4xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-lw-rust/30 bg-lw-rust/10 px-4 py-1.5 text-sm font-semibold text-lw-rust mb-4">
              <Sparkles className="h-4 w-4" />
              Listing Studio
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
            >
              Unlock Listing Studio
            </h2>
            <p className="text-base text-gray-500 max-w-lg mx-auto">
              Generate Instagram captions, Facebook posts, property descriptions, and buyer emails from any listing — in seconds.
            </p>
          </div>

          {/* Subscription cards */}
          <SubscriptionCards realtorProfile={realtorProfile} />

          {/* Sample output */}
          <SampleOutputSection />

          {/* Bottom CTA nudge */}
          <div className="mt-6 text-center">
            <Link href="/listing-studio">
              <Button variant="outline" className="border-gray-200 text-gray-500 hover:bg-gray-50 text-sm">
                See full feature details
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── STATE B + C — Active subscription (ListingStudio handles empty vs. populated) ──

  return (
    <DashboardLayout
      userName={userName || 'User'}
      pageTitle="LISTING STUDIO"
      navItems={NAV_ITEMS}
      activeNavId="listing-studio"
      onLogout={handleLogout}
    >
      <div className="p-6">
        {/* Brand kit bar */}
        <BrandKitBar brandKit={brandKit} />

        {/* Full listing studio — manages list / create / generate views */}
        {realtorProfile && (
          <ListingStudio realtorProfile={realtorProfile} />
        )}
      </div>
    </DashboardLayout>
  );
}
