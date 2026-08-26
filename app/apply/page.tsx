'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase-browser';
import ApplicationForm from '@/app/contractor-dashboard/ApplicationForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  ArrowRight,
  CircleCheck as CheckCircle2,
  Shield,
} from 'lucide-react';
import { Reveal } from '@/components/motion';

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
  const formSectionRef = useRef<HTMLDivElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
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
      setAuthRequired(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.id) {
          if (!cancelled) {
            setAuthRequired(true);
            setState(null);
            setCheckingAuth(false);
          }
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

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-white text-mkt-ink mkt-scope">
      <Navigation variant="light" />

      {/* ABOVE THE FOLD */}
      <section className="bg-mkt-navy py-16 md:py-24 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <Reveal immediate delay={0}>
            <p className="text-lw-rust text-sm font-semibold uppercase tracking-widest mb-4">Founding Contractor Applications</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              Founding Contractor Spots Are Open
            </h1>
          </Reveal>
          <Reveal immediate delay={100}>
            <ul className="mx-auto mb-10 max-w-lg space-y-3 text-left">
              <li className="flex items-start gap-3 text-white/85">
                <CheckCircle2 className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
                A predictable monthly subscription — not a per-lead fee, not a bidding war.
              </li>
              <li className="flex items-start gap-3 text-white/85">
                <CheckCircle2 className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
                One-time $75 activation fee covers your IronClad Verified business review.
              </li>
              <li className="flex items-start gap-3 text-white/85">
                <CheckCircle2 className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
                Founding rates lock in permanently — you&apos;ll never pay the post-launch price.
              </li>
            </ul>
          </Reveal>
          <Reveal immediate delay={180}>
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold px-8"
            >
              Start Your Application
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* BELOW THE FOLD: rate reminder / verified / urgency */}
      <section className="py-14 bg-white border-b border-zinc-200">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3 mb-10">
            {[
              { name: 'Basic', price: '$159/mo' },
              { name: 'Preferred', price: '$279/mo' },
              { name: 'Elite', price: '$479/mo' },
            ].map((tier) => (
              <div key={tier.name} className="lw-card-light p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-1">{tier.name}</p>
                <p className="text-2xl font-bold text-mkt-ink">{tier.price}</p>
                <p className="text-xs text-mkt-ink/60 mt-1">Locked in permanently for founding members</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
              <p className="text-sm text-mkt-ink/80">
                <span className="font-semibold text-mkt-ink">$75 one-time activation fee.</span> Not recurring — it covers your IronClad Verified business review.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-lw-rust shrink-0 mt-0.5" />
              <p className="text-sm text-mkt-ink/80">
                <span className="font-semibold text-mkt-ink">IronClad Verified</span> means ListWorx has confirmed your business entity, license, and insurance — before homeowners ever see your profile.{' '}
                <Link href="/ironclad" target="_blank" rel="noopener noreferrer" className="text-lw-rust underline underline-offset-2">
                  Read the standards
                </Link>.
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-semibold text-mkt-ink/70">
            Spots are limited in your market. Founding pricing closes when the launch cohort is full.
          </p>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <div ref={formSectionRef} className="container mx-auto px-4 py-12 max-w-6xl">
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
        ) : authRequired ? (
          <div className="max-w-xl mx-auto text-center lw-card-light p-8">
            <h2 className="text-xl font-bold text-mkt-ink mb-3">Create your free account to get started</h2>
            <p className="text-mkt-ink/70 mb-6">
              Your application takes about 10 minutes. Create a free contractor account first — no payment required until after approval.
            </p>
            <Link href="/contractor-portal">
              <Button size="lg" className="bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold px-8">
                Continue to Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : !state ? null : (
          <div>
            {founderSelection && (
                <Reveal className="mb-6 rounded-xl border border-lw-rust/40 bg-lw-rust/5 px-5 py-4">
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
                </Reveal>
              )}

            <Reveal delay={founderSelection ? 70 : 0} className="bg-lw-surface-card rounded-2xl border border-lw-border-light p-6 sm:p-8 shadow-sm">
              <ApplicationForm
                userId={state.userId}
                userEmail={state.userEmail}
                existingProfile={state.existingProfile}
                founderSelection={founderSelection ?? undefined}
                onSuccess={refreshFromApplication}
              />
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
