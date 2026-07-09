'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  User,
  GraduationCap,
  Megaphone,
  CreditCard,
  Award,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { ACES_PARTNER, type DemoTierId } from '@/lib/demo/acesDemoData';
import DemoDashboardShell, { type DemoNavItem } from '../DemoDashboardShell';
import TierSwitcher from './TierSwitcher';
import OverviewTab from './OverviewTab';
import ReferralsTab from './ReferralsTab';
import ProfileTab from './ProfileTab';
import AcademyTab from './AcademyTab';
import MarketingTab from './MarketingTab';
import SubscriptionTab from './SubscriptionTab';
import BadgesTab from './BadgesTab';

type TabId = 'overview' | 'referrals' | 'profile' | 'academy' | 'marketing' | 'subscription' | 'badges';

const NAV_ITEMS: DemoNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'referrals', label: 'Referrals', icon: Inbox },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'academy', label: 'Academy', icon: GraduationCap, badgeLabel: 'ACES' },
  { id: 'marketing', label: 'Marketing Tools', icon: Megaphone },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'badges', label: 'Badges', icon: Award },
];

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Dashboard',
  referrals: 'Referrals',
  profile: 'My Profile',
  academy: 'ListWorx Academy',
  marketing: 'Marketing Tools',
  subscription: 'Subscription',
  badges: 'Badges',
};

export default function ContractorDemoDashboard() {
  const [tier, setTier] = useState<DemoTierId>('elite');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tierBadgeLabel = tier === 'elite' ? 'Elite' : tier === 'preferred' ? 'Preferred' : 'Basic';

  return (
    <DemoDashboardShell
      userName={ACES_PARTNER.owner_name}
      tierBadge={tierBadgeLabel}
      pageTitle={TAB_TITLES[activeTab]}
      navItems={NAV_ITEMS}
      activeNavId={activeTab}
      onNavSelect={(id) => setActiveTab(id as TabId)}
    >
      <div className="p-6 space-y-6 text-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Demo Mode</p>
            <h2 className="text-sm text-gray-500">Viewing as a contractor partner — switch tiers to see what unlocks.</h2>
          </div>
          <TierSwitcher tier={tier} onSelectTier={setTier} />
        </div>

        {activeTab === 'overview' && <OverviewTab tier={tier} />}
        {activeTab === 'referrals' && <ReferralsTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'academy' && <AcademyTab />}
        {activeTab === 'marketing' && <MarketingTab tier={tier} />}
        {activeTab === 'subscription' && <SubscriptionTab tier={tier} onSelectTier={setTier} />}
        {activeTab === 'badges' && <BadgesTab tier={tier} />}
      </div>
      <Toaster />
    </DemoDashboardShell>
  );
}
