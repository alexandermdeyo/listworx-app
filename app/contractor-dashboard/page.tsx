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
import { ContractorProfile, TIERS } from './types';
import StatusCard from './StatusCard';
import SubscriptionSection from './SubscriptionSection';
import PerformanceSection from './PerformanceSection';
import MarketingSection from './MarketingSection';
import ApplicationForm from './ApplicationForm';
import ContractorProfileEditor from './ContractorProfileEditor';
import ReferralsSection from './ReferralsSection';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  RefreshCw,
  LogOut,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Upload,
  CircleCheck as CheckCircle2,
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DashboardTab = 'overview' | 'profile' | 'settings';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState({
    company_name: '',
    owner_name: '',
    phone: '',
    website: '',
    bio: '',
    license_number: '',
    email: '',
    google_business_url: '',
    business_description: '',
    years_in_business: 0,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);
  const [saveProfileInfo, setSaveProfileInfo] = useState<string | null>(null);

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    if (!profile) return;

    setProfileEdit({
      company_name: profile.company_name || '',
      owner_name: profile.owner_name || '',
      phone: profile.phone || '',
      website: profile.website || '',
      bio: profile.bio || '',
      license_number: profile.license_number || '',
      email: profile.email || '',
      google_business_url: (profile as any).google_business_url || '',
      business_description: (profile as any).business_description || '',
      years_in_business: (profile as any).years_in_business || 0,
    });

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

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || !event.target.files[0] || !profile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = event.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File must be under 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}-${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (storageError) {
        throw new Error(`Upload failed: ${storageError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      setProfile({ ...profile, logo_url: publicUrl });
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleEditProfile() {
    if (!profile) return;

    setProfileEdit({
      company_name: profile.company_name || '',
      owner_name: profile.owner_name || '',
      phone: profile.phone || '',
      website: profile.website || '',
      bio: profile.bio || '',
      license_number: profile.license_number || '',
      email: profile.email || '',
      google_business_url: (profile as any).google_business_url || '',
      business_description: (profile as any).business_description || '',
      years_in_business: (profile as any).years_in_business || 0,
    });

    setSaveProfileError(null);
    setSaveProfileInfo(null);
    setIsEditingProfile(true);
  }

  function handleCancelEdit() {
    setIsEditingProfile(false);
    setSaveProfileError(null);
    setSaveProfileInfo(null);
  }

  async function handleSaveProfile() {
    if (!profile) return;

    setSavingProfile(true);
    setSaveProfileError(null);
    setSaveProfileInfo(null);

    try {
      const newEmail = profileEdit.email.trim().toLowerCase();
      const emailChanged = newEmail && newEmail !== profile.email?.toLowerCase();

      if (emailChanged) {
        const res = await fetch('/api/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail }),
        });

        const json = await res.json();

        if (!res.ok) {
          setSaveProfileError(
            json.error || "We couldn't update your email. Please try again or contact support."
          );
          setSavingProfile(false);
          return;
        }

        setSaveProfileInfo(json.message);
        setProfile({ ...profile, email: newEmail });
        setUserEmail(newEmail);
      }

      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          company_name: profileEdit.company_name,
          owner_name: profileEdit.owner_name,
          phone: profileEdit.phone,
          website: profileEdit.website,
          bio: profileEdit.bio,
          license_number: profileEdit.license_number,
          google_business_url: profileEdit.google_business_url,
          business_description: profileEdit.business_description,
          years_in_business: profileEdit.years_in_business || 0,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              company_name: profileEdit.company_name,
              owner_name: profileEdit.owner_name,
              phone: profileEdit.phone,
              website: profileEdit.website,
              bio: profileEdit.bio,
              license_number: profileEdit.license_number,
              google_business_url: profileEdit.google_business_url,
              business_description: profileEdit.business_description,
              years_in_business: profileEdit.years_in_business,
            }
          : prev
      );

      setProfileSaved(true);
      setIsEditingProfile(false);
      setTimeout(() => {
        setProfileSaved(false);
        setSaveProfileInfo(null);
      }, 6000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveProfileError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSavingProfile(false);
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

  async function handleManageSubscription() {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Portal error:', err);
    } finally {
      setPortalLoading(false);
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
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
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

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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

  const isExpiringSoon = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return d <= thirtyDays && d > new Date();
  };

  const licenseExpiring = isExpiringSoon(profile.license_expiration_date);
  const insuranceExpiring = isExpiringSoon(profile.insurance_expiration_date);
  const hasExpiryWarning = licenseExpiring || insuranceExpiring;

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
      onClick: () => setActiveTab('profile'),
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
      onClick: () => {
        if (
          profile.partner_status === PARTNER_STATUS.APPLIED ||
          profile.partner_status === PARTNER_STATUS.UNDER_REVIEW
        ) {
          setActiveTab('settings');
        }
      },
    },
  ];

  const activeNavId =
    activeTab === 'profile' ? 'profile' :
    activeTab === 'settings' ? 'settings' :
    'overview';

  return (
    <DashboardLayout
      userName={profile.owner_name || profile.company_name || userEmail}
      tierBadge={profile.tier || null}
      pageTitle={
        activeTab === 'profile' ? 'My Profile' :
        activeTab === 'settings' ? 'Edit Application' :
        'Dashboard'
      }
      navItems={navItems}
      activeNavId={activeNavId}
      onLogout={handleLogout}
      hasNotifications={false}
    >
      <div className="p-6 space-y-6">
        {/* Expiry warning banner */}
        {hasExpiryWarning && (
          <div className="flex items-start gap-3 rounded-lg border border-lw-rust/40 bg-lw-rust/5 px-4 py-3">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-lw-rust" />
            <div>
              <p className="text-sm font-semibold text-lw-rust">Credential Expiring Soon</p>
              <p className="text-sm text-gray-600">
                {[
                  licenseExpiring && 'Your contractor license expires within 30 days.',
                  insuranceExpiring && 'Your insurance certificate expires within 30 days.',
                ]
                  .filter(Boolean)
                  .join(' ')}
                {' '}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="font-medium text-lw-rust underline hover:no-underline"
                >
                  Update Documents →
                </button>
              </p>
            </div>
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
              <MarketingSection
                profile={profile}
                onCheckout={handleCheckout}
                checkoutLoading={checkoutLoading}
              />
            </>
          )}

          {activeTab === 'profile' && profile && (
            <ContractorProfileEditor
              profile={profile as any}
              onProfileUpdated={(nextProfile) => setProfile(nextProfile as any)}
              onRefresh={refreshProfile}
              logoInputRef={fileInputRef}
              onLogoUpload={handleLogoUpload}
              logoUploading={uploading}
              logoUploadError={uploadError}
            />
          )}

          {activeTab === 'settings' && (
            <div className="max-w-3xl">
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Edit Your Application</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    You can update your application details while it is under review.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <ApplicationForm
                  userId={userId!}
                  userEmail={userEmail}
                  existingProfile={profile}
                  onSuccess={refreshProfile}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}