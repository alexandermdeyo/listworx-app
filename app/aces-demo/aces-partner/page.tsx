'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, DollarSign, GraduationCap, Megaphone } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import DemoDashboardShell, { type DemoNavItem } from '../DemoDashboardShell';
import OverviewTab from './OverviewTab';
import ReferredContractorsTab from './ReferredContractorsTab';
import CommissionsTab from './CommissionsTab';
import TrainingCenterTab from './TrainingCenterTab';
import MarketingAssetsTab from './MarketingAssetsTab';

type TabId = 'overview' | 'referred' | 'commissions' | 'training' | 'marketing';

const NAV_ITEMS: DemoNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'referred', label: 'Referred Contractors', icon: Users },
  { id: 'commissions', label: 'Commissions', icon: DollarSign },
  { id: 'training', label: 'Training Center', icon: GraduationCap },
  { id: 'marketing', label: 'Marketing Assets', icon: Megaphone },
];

const TAB_TITLES: Record<TabId, string> = {
  overview: 'ACES Partner Dashboard',
  referred: 'Referred Contractors',
  commissions: 'Commissions',
  training: 'Training Center',
  marketing: 'Marketing Assets',
};

export default function AcesPartnerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <DemoDashboardShell
      userName="ACES"
      userSubtitle="American Contractors Exam Services"
      avatarInitials="ACES"
      avatarBg="#E8621A"
      avatarImageSrc="/aces-logo.jpg"
      tierBadge="Verified Partner"
      pageTitle={TAB_TITLES[activeTab]}
      navItems={NAV_ITEMS}
      activeNavId={activeTab}
      onNavSelect={(id) => setActiveTab(id as TabId)}
    >
      <div className="p-6 space-y-6 text-gray-900">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'referred' && <ReferredContractorsTab />}
        {activeTab === 'commissions' && <CommissionsTab />}
        {activeTab === 'training' && <TrainingCenterTab />}
        {activeTab === 'marketing' && <MarketingAssetsTab />}
      </div>
      <Toaster />
    </DemoDashboardShell>
  );
}
