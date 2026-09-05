'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/Navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { contractorHasAiToolkit } from '@/lib/tiers-config';
import { ContractorProfile, TIERS } from './types';
import StatusCard from './StatusCard';
import SubscriptionSection from './SubscriptionSection';
import PerformanceSection from './PerformanceSection';
import MarketingSection from './MarketingSection';
import ApplicationForm from './ApplicationForm';
import ReferralsSection from './ReferralsSection';
import ProfileTab from './ProfileTab';
import DocumentsTab from './DocumentsTab';
import SettingsTab from './SettingsTab';
import AcademyTab from './AcademyTab';
import { Toaster } from '@/components/ui/toaster';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  RefreshCw,
  LogOut,
  User,
  Shield,
  CreditCard,
  LayoutDashboard,
  Settings,
  ChartBar as BarChart3,
  Inbox,
  FileText,
  Video,
  Bell,
  Star,
  Zap,
  GraduationCap,
} from 'lucide-react';

type DashboardTab = 'overview' | 'profile' | 'documents' | 'academy' | 'settings';
type Role =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER'
  | null;

function normalizeRole(role?: string | null): Role {
  const normalized = (role || '').toUpperCase();

  if (
    normalized === 'ADMIN' ||
    normalized === 'CONTRACTOR' ||
    normalized === 'REALTOR' ||
    normalized === 'HOMEOWNER' ||
    normalized === 'PROPERTY_MANAGER'
  ) {
    return normalized as Role;
  }

  return null;
}

export default function ContractorDashboard() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const [referralCount, setReferralCount] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [referralsLast30, setReferralsLast30] = useState(0);

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [complianceExpirations, setComplianceExpirations] = useState<{
    license: string | null;
    insurance: string | null;
  }>({ license: null, insurance: null });

  const [academyEnabled, setAcademyEnabled] = useState(false);

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'academy_enabled')
        .maybeSingle();
      setAcademyEnabled(data?.value === 'true');
    })();
  }, [userId]);

  useEffect(() => {
    if (!profile?.id) return;

    (async () => {
      const { data } = await supabase
        .from('contractor_documents')
        .select('document_type, expiration_date, created_at')
        .eq('contractor_id', profile.id)
        .in('document_type', ['LICENSE', 'INSURANCE'])
        .order('created_at', { ascending: false });

      const license = (data || []).find((d: any) => d.document_type === 'LICENSE')?.expiration_date ?? null;
      const insurance = (data || []).find((d: any) => d.document_type === 'INSURANCE')?.expiration_date ?? null;
      setComplianceExpirations({ license, insurance });
    })();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('contractor-profile-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contractor_profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          setProfile(payload.new as ContractorProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  async function checkAuth() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login?redirect=/contractor-dashboard');
        return;
      }

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        router.push('/login?redirect=/contractor-dashboard');
        return;
      }

      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (appUserError) {
        setError(appUserError.message);
        setAuthChecking(false);
        setLoading(false);
        return;
      }

      const role = normalizeRole(appUser?.role);

      if (role === 'ADMIN') {
        window.location.href = '/admin/crm';
        return;
      }

      if (
        role === 'REALTOR' ||
        role === 'HOMEOWNER' ||
        role === 'PROPERTY_MANAGER'
      ) {
        window.location.href = '/requestor-dashboard';
        return;
      }

      const { data: contractorProfileCheck } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isContractor = role === 'CONTRACTOR' || !!contractorProfileCheck;

      if (!isContractor) {
        window.location.href = '/';
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? '');
      setAuthChecking(false);
      await loadProfile(user.id, user.email ?? '');
    } catch (err: any) {
      setError(err.message);
      setAuthChecking(false);
      setLoading(false);
    }
  }

  async function loadProfile(uid: string, email: string) {
    setLoading(true);

    try {
      const { data, error: profileErr } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const [countiesRes, categoriesRes] = await Promise.all([
        supabase
          .from('contractor_counties')
          .select('county_id, counties(id, name, state_code)')
          .eq('contractor_id', data.id),
        supabase
          .from('contractor_categories')
          .select('category_id, categories(id, name)')
          .eq('contractor_id', data.id),
      ]);

      const liveCounties = (countiesRes.data || []).map((row: any) => row.counties).filter(Boolean);
      const liveTrades = (categoriesRes.data || []).map((row: any) => row.categories).filter(Boolean);

      const enrichedProfile = {
        ...data,
        _liveCounties: liveCounties,
        _liveTrades: liveTrades,
      };

      setProfile(enrichedProfile as any);
      await loadReferralData(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    if (!userId) return;

    setRefreshing(true);

    try {
      const { data, error: profileErr } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileErr && data) {
        const [countiesRes, categoriesRes] = await Promise.all([
          supabase
            .from('contractor_counties')
            .select('county_id, counties(id, name, state_code)')
            .eq('contractor_id', data.id),
          supabase
            .from('contractor_categories')
            .select('category_id, categories(id, name)')
            .eq('contractor_id', data.id),
        ]);

        const liveCounties = (countiesRes.data || []).map((row: any) => row.counties).filter(Boolean);
        const liveTrades = (categoriesRes.data || []).map((row: any) => row.categories).filter(Boolean);

        setProfile({ ...data, _liveCounties: liveCounties, _liveTrades: liveTrades } as any);

        if (data.id) {
          await loadReferralData(data.id);
        }
      } else if (!data) {
        setProfile(null);
      }
    } catch (err: any) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadReferralData(profileId: string) {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [thisMonthResult, totalResult, last30Result] = await Promise.all([
        supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('contractor_id', profileId)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('contractor_id', profileId),
        supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('contractor_id', profileId)
          .gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      setReferralCount(thisMonthResult.count || 0);
      setTotalReferrals(totalResult.count || 0);
      setReferralsLast30(last30Result.count || 0);
    } catch (err) {
      console.error('Referral data error:', err);
    }
  }

  async function handleCheckout(tierId: string, isAnnual: boolean) {
    const key = `${tierId}-${isAnnual ? 'annual' : 'monthly'}`;
    setCheckoutLoading(key);
    setCheckoutError(null);

    try {
      const tier = TIERS.find((t) => t.id === tierId);

      if (!tier) {
        throw new Error(`Unknown tier: ${tierId}`);
      }

      if (!profile?.id) {
        throw new Error('Missing contractor profile ID');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: profile.id,
          tierId: tier.id,
          tierName: tier.name,
          billingPeriod: isAnnual ? 'annual' : 'monthly',
          isAddOn: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.url) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'Failed to create checkout session');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleCancelSubscription() {
    if (
      !confirm(
        'Cancel your subscription? You will stop receiving referrals at the end of your billing period.'
      )
    ) {
      return;
    }

    setCancelLoading(true);

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Cancel error:', err);
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (_e) {
      // still redirect on error
    }
    window.location.href = '/login';
  }

  if (authChecking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-lw-rust" />
          <p className="text-sm text-gray-500">
            {authChecking ? 'Authenticating...' : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md px-4">
          <Alert className="mb-4 border-red-200 bg-red-50 text-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setLoading(true);
                void checkAuth();
              }}
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-900"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasFilledApplication =
    !!profile &&
    (!!profile.company_name || !!profile.owner_name);

  if (!profile || !hasFilledApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}>Partner Application</h1>
              <p className="mt-1 text-sm text-gray-500">{userEmail}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-900"
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
            </Button>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-lg border border-lw-rust/30 bg-lw-rust/5 p-4">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-lw-rust" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Complete Your Application</p>
              <p className="mt-0.5 text-sm text-gray-600">
                Finish your application below to apply as a ListWorx IronClad partner.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
            <ApplicationForm
              userId={userId!}
              userEmail={userEmail}
              existingProfile={profile}
              onSuccess={refreshProfile}
            />
          </div>
        </div>
      </div>
    );
  }

  const isExpiringSoonOrExpired = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return d <= thirtyDays;
  };

  const effectiveLicenseExpiration = complianceExpirations.license || profile.license_expiration_date || null;
  const effectiveInsuranceExpiration = complianceExpirations.insurance || profile.insurance_expiration_date || null;

  const licenseExpiring = isExpiringSoonOrExpired(effectiveLicenseExpiration);
  const insuranceExpiring = isExpiringSoonOrExpired(effectiveInsuranceExpiration);

  const formatExpiryDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const getDaysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDaysMessage = (days: number | null) => {
    if (days === null) return '';
    if (days < 0) return `expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return 'expires today';
    return `expires in ${days} day${days === 1 ? '' : 's'}`;
  };

  const licenseDaysUntil = getDaysUntil(effectiveLicenseExpiration);
  const insuranceDaysUntil = getDaysUntil(effectiveInsuranceExpiration);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => setActiveTab('overview'),
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: Inbox,
      onClick: () => setActiveTab('overview'),
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      onClick: () => setActiveTab('profile'),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      onClick: () => setActiveTab('documents'),
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: Star,
      disabled: true,
    },
    {
      id: 'promo',
      label: 'Promo Videos',
      icon: Video,
      disabled: true,
      badgeLabel: 'Elite',
    },
    ...(academyEnabled
      ? [
          {
            id: 'academy',
            label: 'Academy',
            icon: GraduationCap,
            onClick: () => setActiveTab('academy'),
          },
        ]
      : []),
    {
      id: 'ai-toolkit',
      label: 'AI Toolkit',
      icon: Zap,
      ...(contractorHasAiToolkit(profile)
        ? { onClick: () => router.push('/contractor-dashboard/ai-toolkit') }
        : { disabled: true, badgeLabel: 'Partner' }),
    },
    {
      id: 'flyers',
      label: 'Flyer Builder',
      icon: FileText,
      onClick: () => router.push('/contractor-dashboard/flyers'),
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
      onClick: () => setActiveTab('overview'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      disabled: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => setActiveTab('settings'),
    },
  ];

  const activeNavId =
    activeTab === 'profile' ? 'profile' :
    activeTab === 'documents' ? 'documents' :
    activeTab === 'academy' ? 'academy' :
    activeTab === 'settings' ? 'settings' :
    'overview';

  const showApplicationForm =
    profile.partner_status === PARTNER_STATUS.APPLIED ||
    profile.partner_status === PARTNER_STATUS.UNDER_REVIEW;

  return (
    <DashboardLayout
      userName={profile.owner_name || profile.company_name || userEmail}
      tierBadge={profile.tier || null}
      pageTitle={
        activeTab === 'profile' ? 'My Profile' :
        activeTab === 'documents' ? 'Documents' :
        activeTab === 'academy' ? 'ListWorx Academy' :
        activeTab === 'settings' ? (showApplicationForm ? 'Edit Application' : 'Settings') :
        'Dashboard'
      }
      navItems={navItems}
      activeNavId={activeNavId}
      onLogout={handleLogout}
      hasNotifications={false}
    >
      <div className="p-6 space-y-6 text-gray-900">
        {/* Expiry warning banners */}
        {licenseExpiring && (
          <div
            className="w-full rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{ backgroundColor: '#b91c1c' }}
          >
            <p className="text-sm font-semibold text-white">
              Your contractor license {formatDaysMessage(licenseDaysUntil)} ({formatExpiryDate(effectiveLicenseExpiration)}). Renew your license through ListWorx Academy — powered by ACES, the national standard for contractor licensing in all 50 states — and upload your updated license to your profile to stay active with ListWorx.
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (academyEnabled) {
                    setActiveTab('academy');
                  } else {
                    window.open('https://listworx.co/academy', '_blank', 'noopener,noreferrer');
                  }
                }}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap hover:bg-white/90 transition-colors"
                style={{ color: '#b91c1c' }}
              >
                Go to Academy
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className="rounded-md border border-white/70 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap hover:bg-white/10 transition-colors"
              >
                Update in Documents →
              </button>
            </div>
          </div>
        )}

        {insuranceExpiring && (
          <div
            className="w-full rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            style={{ backgroundColor: '#b91c1c' }}
          >
            <p className="text-sm font-semibold text-white">
              Your insurance {formatDaysMessage(insuranceDaysUntil)} ({formatExpiryDate(effectiveInsuranceExpiration)}). Renew your insurance and upload your updated Certificate of Insurance to your profile to stay active and eligible for referrals with ListWorx.
            </p>
            <button
              onClick={() => setActiveTab('documents')}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap hover:bg-white/90 transition-colors flex-shrink-0"
              style={{ color: '#b91c1c' }}
            >
              Update Insurance →
            </button>
          </div>
        )}

        {/* Status card */}
        <StatusCard
          profile={profile}
          userEmail={userEmail}
          refreshing={refreshing}
          onRefresh={refreshProfile}
          onLogout={handleLogout}
        />

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <SubscriptionSection contractorProfileId={profile?.id} />
              <MarketingSection
                profile={profile}
                onCheckout={handleCheckout}
                checkoutLoading={checkoutLoading}
              />
              <PerformanceSection
                profile={profile}
                performanceData={{
                  totalReferrals,
                  referralsThisMonth: referralCount,
                  referralsLast30Days: referralsLast30,
                  acceptedReferrals: Math.round(totalReferrals * 0.75),
                  declinedReferrals: Math.round(totalReferrals * 0.15),
                  completedJobs: Math.round(totalReferrals * 0.5),
                }}
              />
              <ReferralsSection contractorProfileId={profile.id} />
            </>
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              onProfileUpdated={setProfile}
              onUserEmailUpdated={setUserEmail}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab
              profile={profile}
              onNavigateToProfile={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'academy' && academyEnabled && <AcademyTab />}

          {activeTab === 'settings' && (
            <div className="max-w-3xl space-y-8">
              {showApplicationForm && (
                <div>
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Edit Your Application</p>
                      <p className="mt-0.5 text-sm text-amber-700">
                        You can update your application details while it is under review.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
                    <ApplicationForm
                      userId={userId!}
                      userEmail={userEmail}
                      existingProfile={profile}
                      onSuccess={refreshProfile}
                    />
                  </div>
                </div>
              )}

              <SettingsTab
                profile={profile}
                userEmail={userEmail}
                onNotificationPreferenceChange={(value) => setProfile({ ...profile, notification_email: value })}
              />
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </DashboardLayout>
  );
}