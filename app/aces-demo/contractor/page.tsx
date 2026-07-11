'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  User,
  FileText,
  Star,
  Video,
  GraduationCap,
  Zap,
  CreditCard,
  Award,
  Bell,
  Settings,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { ACES_PARTNER, type DemoTierId } from '@/lib/demo/acesDemoData';
import DemoDashboardShell, { type DemoNavItem } from '../DemoDashboardShell';
import TierSwitcher from './TierSwitcher';
import OverviewTab from './OverviewTab';
import ReferralsTab from './ReferralsTab';
import ProfileTab from './ProfileTab';
import DocumentsTab from './DocumentsTab';
import AcademyTab from './AcademyTab';
import MarketingTab from './MarketingTab';
import SubscriptionTab from './SubscriptionTab';
import BadgesTab from './BadgesTab';
import SettingsTab from './SettingsTab';

type TabId = 'overview' | 'referrals' | 'profile' | 'documents' | 'academy' | 'marketing' | 'subscription' | 'badges' | 'settings';

const NAV_ITEMS: DemoNavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'referrals', label: 'Referrals', icon: Inbox },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'reviews', label: 'Reviews', icon: Star, disabled: true },
  { id: 'promo', label: 'Promo Videos', icon: Video, disabled: true, badgeLabel: 'Elite' },
  { id: 'academy', label: 'Academy', icon: GraduationCap, badgeLabel: 'ACES' },
  { id: 'ai-toolkit', label: 'AI Toolkit', icon: Zap },
  { id: 'flyers', label: 'Flyer Builder', icon: FileText },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'notifications', label: 'Notifications', icon: Bell, disabled: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TAB_TITLES: Record<TabId, string> = {
  overview: 'Dashboard',
  referrals: 'Referrals',
  profile: 'My Profile',
  documents: 'Documents',
  academy: 'ListWorx Academy',
  marketing: 'Marketing Tools',
  subscription: 'Subscription',
  badges: 'Badges',
  settings: 'Settings',
};

export default function ContractorDemoDashboard() {
  const { toast } = useToast();
  const [tier, setTier] = useState<DemoTierId>('elite');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tierBadgeLabel = tier === 'elite' ? 'Elite' : tier === 'preferred' ? 'Preferred' : 'Basic';

  function handleNavSelect(id: string) {
    // AI Toolkit and Flyer Builder both surface the same marketing tools preview in this demo.
    if (id === 'ai-toolkit' || id === 'flyers') {
      setActiveTab('marketing');
      return;
    }
    setActiveTab(id as TabId);
  }

  return (
    <DemoDashboardShell
      userName={ACES_PARTNER.owner_name}
      tierBadge={tierBadgeLabel}
      pageTitle={TAB_TITLES[activeTab]}
      navItems={NAV_ITEMS}
      activeNavId={activeTab === 'marketing' ? 'ai-toolkit' : activeTab}
      onNavSelect={handleNavSelect}
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
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'academy' && <AcademyTab />}
        {activeTab === 'marketing' && <MarketingTab tier={tier} />}
        {activeTab === 'subscription' && <SubscriptionTab tier={tier} onSelectTier={setTier} />}
        {activeTab === 'badges' && <BadgesTab tier={tier} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
      <Toaster />
    </DemoDashboardShell>
  );
}
