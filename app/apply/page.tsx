'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase-browser';
import ApplicationForm from '@/app/contractor-dashboard/ApplicationForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';

export type FounderSelection = {
  tierId: string;
  tierName: string;
  addons: string[];
  total: number;
};

const LS_KEY = 'lw_founder_selection';

function readFounderSelection(params: URLSearchParams): FounderSelection | null {
  const tierId = params.get('tier');
  if (tierId) {
    const addons = params.get('addons') ? params.get('addons')!.split(',').filter(Boolean) : [];
    const total = Number(params.get('total') || 75);
    // derive a display name from the id
    const tierName = tierId
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { tierId, tierName, addons, total };
  }
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored) as FounderSelection;
  } catch {
    // ignore
  }
  return null;
}

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

function isRequestorRole(role: Role) {
  return role === 'REALTOR' || role === 'HOMEOWNER' || role === 'PROPERTY_MANAGER';
}

function normalizePartnerStatus(status?: string | null) {
  return (status || '').toString().trim().toLowerCase();
}

function getContractorDestination(partnerStatus: string) {
  if (partnerStatus === 'active') return '/contractor-dashboard';
  if (partnerStatus === 'approved') return '/billing';
  return '/apply';
}

interface AuthenticatedContractorState {
  userId: string;
  userEmail: string;
  existingProfile: any;
}

export default function ApplyPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const searchParams = useSearchParams();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [state, setState] = useState<AuthenticatedContractorState | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [founderSelection, setFounderSelection] = useState<FounderSelection | null>(null);

  useEffect(() => {
    setFounderSelection(readFounderSelection(searchParams));
  }, [searchParams]);

  const refreshFromApplication = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveApplyState() {
      setCheckingAuth(true);
      setAuthError('');

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message || 'Could not verify your session.');
        }

        if (!user?.id) {
          window.location.replace('/contractor-portal');
          return;
        }

        const [{ data: appUser, error: appUserError }, { data: profile, error: profileError }] =
          await Promise.all([
            supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
            supabase
              .from('contractor_profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);

        if (appUserError) {
          console.error('[apply] role lookup failed', appUserError);
        }

        if (profileError) {
          console.error('[apply] contractor profile lookup failed', profileError);
        }

        const role = normalizeRole(appUser?.role);
        const hasContractorProfile = !!profile;
        const partnerStatus = normalizePartnerStatus(profile?.partner_status);
        const destination = getContractorDestination(partnerStatus);

        if (role === 'ADMIN') {
          window.location.replace('/admin/crm');
          return;
        }

        if (isRequestorRole(role)) {
          window.location.replace('/requestor-dashboard');
          return;
        }

        const isContractor = role === 'CONTRACTOR' || hasContractorProfile;

        if (!isContractor) {
          window.location.replace('/');
          return;
        }

        if (destination !== '/apply') {
          window.location.replace(destination);
          return;
        }

        let existingProfile: any = profile || null;

        if (existingProfile?.id) {
          const [countiesRes, categoriesRes] = await Promise.all([
            supabase
              .from('contractor_counties')
              .select('county_id, counties(id, name, state_code)')
              .eq('contractor_id', existingProfile.id),
            supabase
              .from('contractor_categories')
              .select('category_id, categories(id, name)')
              .eq('contractor_id', existingProfile.id),
          ]);

          const liveCounties = (countiesRes.data || []).map((row: any) => row.counties).filter(Boolean);
          const liveTrades = (categoriesRes.data || []).map((row: any) => row.categories).filter(Boolean);

          existingProfile = {
            ...existingProfile,
            _liveCounties: liveCounties,
            _liveTrades: liveTrades,
          };
        }

        if (!cancelled) {
          setState({
            userId: user.id,
            userEmail: user.email || '',
            existingProfile,
          });
          setCheckingAuth(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setAuthError(err?.message || 'Something went wrong while loading your application.');
          setState(null);
          setCheckingAuth(false);
        }
      }
    }

    void resolveApplyState();

    return () => {
      cancelled = true;
    };
  }, [reloadTick, supabase]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {checkingAuth ? (
          <div className="py-20 flex items-center justify-center text-lw-text/60 gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your application...
          </div>
        ) : authError ? (
          <div className="max-w-xl mx-auto">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{authError}</AlertDescription>
            </Alert>
          </div>
        ) : !state ? null : (
          <div>
            <div className="mb-8 text-center">
              <img
                src="/Ironclad_Standards_Logo.png"
                alt=""
                className="mx-auto mb-6 h-20 md:h-24 w-auto drop-shadow-md"
                aria-hidden="true"
              />
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 tracking-tight">
                Apply to Join the ListWorx Network
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Applications are reviewed by our team within 72 hours. We vet every contractor before approving network access. After approval, you will receive instructions to complete your subscription and claim your Founding Partner spot if one is still available in your trade and county.
              </p>
            </div>

            {founderSelection && (
                <div className="mb-6 rounded-xl border border-lw-rust/40 bg-lw-rust/5 px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-lw-rust">Founding Partner Selection</p>
                      <p className="text-sm text-lw-text mt-0.5">
                        <span className="font-semibold">{founderSelection.tierName}</span>
                        {founderSelection.addons.length > 0 && (
                          <> + {founderSelection.addons.length} add-on{founderSelection.addons.length !== 1 ? 's' : ''}</>
                        )}
                        <span className="ml-2 text-lw-text/60">${founderSelection.total} due today after approval</span>
                      </p>
                    </div>
                    <a
                      href="/founding-partner"
                      className="text-xs text-lw-rust underline underline-offset-2 whitespace-nowrap self-start sm:self-center"
                    >
                      Change selections
                    </a>
                  </div>
                </div>
              )}

            <div className="bg-lw-surface-card rounded-2xl border border-lw-border-light p-6 sm:p-8 shadow-sm">
              <ApplicationForm
                userId={state.userId}
                userEmail={state.userEmail}
                existingProfile={state.existingProfile}
                founderSelection={founderSelection ?? undefined}
                onSuccess={refreshFromApplication}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
