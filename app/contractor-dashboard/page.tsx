'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import ComplianceDocuments from './ComplianceDocuments';
import DocumentsTab from './DocumentsTab';
import SettingsTab from './SettingsTab';
import AcademyTab from './AcademyTab';
import { Toaster } from '@/components/ui/toaster';
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
  Download,
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
  Zap,
  GraduationCap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      onClick: () => router.push('/contractor-dashboard/ai-toolkit'),
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
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  {/* Company Information */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-base font-bold text-gray-900">Company Information</h3>
                      {!isEditingProfile ? (
                        <Button
                          onClick={handleEditProfile}
                          size="sm"
                          variant="outline"
                          className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleCancelEdit}
                            size="sm"
                            variant="ghost"
                            className="text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            disabled={savingProfile}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            size="sm"
                            disabled={savingProfile}
                            className="gap-1.5 text-white"
                            style={{ backgroundColor: '#E8621A' }}
                          >
                            {savingProfile ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>

                    {profileSaved && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                        <p className="text-sm text-emerald-700">Profile saved successfully.</p>
                      </div>
                    )}

                    {saveProfileError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                        <p className="text-sm text-red-700">{saveProfileError}</p>
                      </div>
                    )}

                    {saveProfileInfo && (
                      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                        <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                        <p className="text-sm text-blue-700">{saveProfileInfo}</p>
                      </div>
                    )}

                    {!isEditingProfile ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {[
                            { label: 'Company Name', icon: Building2, value: profile.company_name },
                            { label: 'Owner / Contact Name', icon: User, value: profile.owner_name },
                            { label: 'Phone Number', icon: Phone, value: profile.phone },
                            { label: 'License Number', icon: Shield, value: profile.license_number || '—' },
                          ].map((field) => (
                            <div key={field.label}>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                {field.label}
                              </p>
                              <div className="flex items-center gap-2">
                                <field.icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                <p className="text-sm font-medium text-gray-900">{field.value || '—'}</p>
                              </div>
                            </div>
                          ))}

                          <div className="sm:col-span-2">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                              Email Address
                            </p>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                              <p className="text-sm text-gray-700">{profile.email}</p>
                            </div>
                          </div>
                        </div>

                        {profile.bio && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Bio</p>
                            <p className="text-sm referraling-relaxed text-gray-700">{profile.bio}</p>
                          </div>
                        )}

                        {(profile as any).business_description && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                              Business Description
                            </p>
                            <p className="text-sm referraling-relaxed text-gray-700">{(profile as any).business_description}</p>
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          {profile.website && (
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Business Website
                              </p>
                              <a
                                href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-sm text-lw-rust hover:underline"
                              >
                                {profile.website}
                              </a>
                            </div>
                          )}

                          {(profile as any).google_business_url && (
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Google Business Profile
                              </p>
                              <a
                                href={(profile as any).google_business_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-sm text-lw-rust hover:underline"
                              >
                                View Profile
                              </a>
                            </div>
                          )}

                          {(profile as any).years_in_business > 0 && (
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Years in Business
                              </p>
                              <p className="text-sm font-medium text-gray-900">{(profile as any).years_in_business}</p>
                            </div>
                          )}
                        </div>

                        {(profile as any).profile_slug && (
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                              Public Profile
                            </p>
                            <a
                              href={`/contractor/${(profile as any).profile_slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-lw-rust hover:underline"
                            >
                              View Public Profile
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {[
                            { id: 'company_name', label: 'Company Name', icon: Building2, type: 'text', placeholder: 'Your company name' },
                            { id: 'owner_name', label: 'Owner / Contact Name', icon: User, type: 'text', placeholder: 'Full name' },
                            {
                              id: 'phone',
                              label: 'Phone Number',
                              icon: Phone,
                              type: 'tel',
                              placeholder: '(615) 000-0000',
                              formatFn: (v: string) => {
                                const digits = v.replace(/\D/g, '').slice(0, 10);
                                if (digits.length <= 3) return digits.length ? `(${digits}` : '';
                                if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                                return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                              },
                            },
                            { id: 'license_number', label: 'License Number', icon: Shield, type: 'text', placeholder: 'Optional' },
                          ].map((field) => (
                            <div key={field.id}>
                              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                                {field.label}
                              </Label>
                              <div className="relative">
                                <field.icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                  type={field.type}
                                  value={profileEdit[field.id as keyof typeof profileEdit]}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const val = (field as any).formatFn ? (field as any).formatFn(raw) : raw;
                                    setProfileEdit({ ...profileEdit, [field.id]: val });
                                  }}
                                  placeholder={field.placeholder}
                                  className="border-gray-300 bg-white pl-9 text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                                />
                              </div>
                            </div>
                          ))}

                          <div className="sm:col-span-2">
                            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                              Email Address
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input
                                type="email"
                                value={profileEdit.email}
                                onChange={(e) => setProfileEdit({ ...profileEdit, email: e.target.value })}
                                placeholder="your@email.com"
                                className="border-gray-300 bg-white pl-9 text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                              />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500">
                              Changing your email will update your login credentials.
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                            Short Bio
                          </Label>
                          <textarea
                            value={profileEdit.bio}
                            onChange={(e) => setProfileEdit({ ...profileEdit, bio: e.target.value })}
                            placeholder="Brief tagline or summary..."
                            rows={2}
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/10"
                          />
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                            Business Description
                          </Label>
                          <textarea
                            value={profileEdit.business_description}
                            onChange={(e) => setProfileEdit({ ...profileEdit, business_description: e.target.value })}
                            placeholder="Detailed description of your business, experience, and services..."
                            rows={4}
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/10"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                              Business Website
                            </Label>
                            <Input
                              type="url"
                              value={profileEdit.website}
                              onChange={(e) => setProfileEdit({ ...profileEdit, website: e.target.value })}
                              placeholder="https://..."
                              className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                            />
                          </div>

                          <div>
                            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                              Years in Business
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={profileEdit.years_in_business || ''}
                              onChange={(e) => setProfileEdit({ ...profileEdit, years_in_business: parseInt(e.target.value) || 0 })}
                              placeholder="e.g. 10"
                              className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                            Google Business Profile URL
                          </Label>
                          <Input
                            type="url"
                            value={profileEdit.google_business_url}
                            onChange={(e) => setProfileEdit({ ...profileEdit, google_business_url: e.target.value })}
                            placeholder="https://g.page/..."
                            className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Areas */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-gray-900">Service Areas</h3>
                    {(profile as any)._liveCounties && (profile as any)._liveCounties.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(profile as any)._liveCounties.map((county: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {county.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No service areas added yet. Complete your application to add counties.
                      </p>
                    )}
                  </div>

                  {/* Trade Specialties */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-gray-900">Trade Specialties</h3>
                    {(profile as any)._liveTrades && (profile as any)._liveTrades.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(profile as any)._liveTrades.map((trade: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-full border border-lw-rust/20 bg-lw-rust/5 px-3 py-1 text-xs font-medium text-lw-rust"
                          >
                            <Briefcase className="h-3 w-3" />
                            {trade.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No trades selected yet. Complete your application to add specialties.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Company Logo */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-gray-900">Company Logo</h3>
                    <div className="flex flex-col items-center gap-4">
                      {profile.logo_url ? (
                        <img
                          src={profile.logo_url}
                          alt="Company Logo"
                          className="h-24 w-24 rounded-lg border border-gray-200 bg-gray-50 p-2 object-contain"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                          <Building2 className="h-10 w-10 text-gray-300" />
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                      />

                      <div className="flex w-full gap-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              {profile.logo_url ? 'Replace Logo' : 'Upload Logo'}
                            </>
                          )}
                        </Button>

                        {profile.logo_url && (
                          <a
                            href={profile.logo_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              buttonVariants({ variant: 'outline', size: 'sm' }),
                              'flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Logo
                          </a>
                        )}
                      </div>

                      <p className="text-center text-xs text-gray-400">PNG, JPG, WebP — max 5MB</p>

                      {uploadError && (
                        <div className="flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                          <p className="text-xs text-red-700">{uploadError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-gray-900">Account Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Partner Status</span>
                        <span className="font-medium capitalize text-gray-900">{profile.partner_status}</span>
                      </div>

                      {profile.tier && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Plan</span>
                          <span className="font-medium capitalize text-lw-rust">{profile.tier}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Member Since</span>
                        <span className="font-medium text-gray-900">
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {profile.partner_status === PARTNER_STATUS.ACTIVE && (
                        <div className="border-t border-gray-100 pt-3">
                          <Button
                            onClick={handleManageSubscription}
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                            disabled={portalLoading}
                          >
                            {portalLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            Manage Billing
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <ComplianceDocuments
                contractorId={profile.id}
                userId={profile.user_id}
                licenseExpirationDate={profile.license_expiration_date}
                insuranceExpirationDate={profile.insurance_expiration_date}
              />
            </div>
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