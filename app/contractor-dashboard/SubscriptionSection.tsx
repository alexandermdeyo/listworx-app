'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle, Circle as CircleIcon, Shield, Zap, Crown, Truck, Star, CircleAlert as AlertCircle, Loader as Loader2, Lock, CreditCard, CircleArrowUp as ArrowUpCircle } from 'lucide-react';
import { PARTNER_STATUS } from '@/lib/partner-status';

interface Tier {
  id: 'basic' | 'preferred' | 'elite';
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  unavailableFeatures?: string[];
  icon: any;
  highlight?: boolean;
  badgeText?: string;
}

interface AddOn {
  id: 'ironclad_badge_kit' | 'featured_spotlight';
  name: string;
  description: string;
  monthlyPrice?: number;
  annualPrice?: number;
  icon: any;
  eligibility?: string;
  tierRequired?: string;
  monthsRequired?: number;
  hasSubscription?: boolean;
}

const TIERS: Tier[] = [
  {
    id: 'basic',
    name: 'Basic Partner',
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: Shield,
    badgeText: 'Entry Level',
    description: 'Get listed and start receiving referrals',
    features: [
      'Public profile in the contractor directory',
      'Eligible for referral matching in your service area',
      'Standard placement in referral rotation',
      'Credential tracking and compliance tools',
      'Email notifications for new referrals',
    ],
    unavailableFeatures: [
      'Priority referral placement',
      'Enhanced profile visibility',
      'Promotional video package',
    ],
  },
  {
    id: 'preferred',
    name: 'Preferred Partner',
    monthlyPrice: 349,
    annualPrice: 3490,
    icon: Zap,
    badgeText: 'Most Popular',
    highlight: true,
    description: 'Better placement and enhanced visibility',
    features: [
      'Everything in Basic',
      'Priority placement in referral matching',
      'Enhanced visibility with logo in your listing',
      'IronClad Certified Partner badge',
      'Referral analytics and reporting',
      'Dedicated account support',
    ],
    unavailableFeatures: [
      'Top-priority referral positioning',
      'Promotional video package',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Partner',
    monthlyPrice: 599,
    annualPrice: 5990,
    icon: Crown,
    badgeText: 'Top Tier',
    description: 'Maximum referral priority and premium benefits',
    features: [
      'Everything in Preferred',
      'Top-priority referral positioning',
      'Premium profile placement and IronClad Elite badge',
      'Advanced analytics dashboard',
      'Priority phone support',
      'Quarterly business review',
      'Annual: Professionally produced 60-second promo video',
    ],
  },
];

const ADD_ONS: AddOn[] = [
  {
    id: 'ironclad_badge_kit',
    name: 'IronClad Badge & Decal Kit',
    description: 'Physical truck decal + digital badge pack for website and social media',
    monthlyPrice: 599,
    icon: Truck,
    eligibility: 'One-time purchase • Requires active subscription',
    hasSubscription: false,
  },
  {
    id: 'featured_spotlight',
    name: 'Featured Partner Spotlight',
    description: 'Featured marketing placement on homepage and promotional channels',
    monthlyPrice: 299,
    annualPrice: 2990,
    icon: Star,
    eligibility: 'Available as monthly or annual subscription',
    hasSubscription: true,
  },
];

type SubscriptionSectionProps = {
  contractorProfileId?: string | null;
};

export default function SubscriptionSection({
  contractorProfileId: contractorProfileIdProp = null,
}: SubscriptionSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [contractorProfileId, setContractorProfileId] = useState<string | null>(
    contractorProfileIdProp
  );
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);
  const [isAnnualSubscription, setIsAnnualSubscription] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionState();
  }, [contractorProfileIdProp]);

  const fetchSubscriptionState = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage('You must be logged in to manage your subscription.');
        return;
      }

      let profileId = contractorProfileIdProp;

      if (!profileId) {
        const { data: contractorProfile, error: profileError } = await supabase
          .from('contractor_profiles')
          .select('id, partner_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError || !contractorProfile) {
          setErrorMessage('Could not find your contractor profile.');
          return;
        }

        profileId = contractorProfile.id;
        setPartnerStatus(contractorProfile.partner_status);
      } else {
        const { data: contractorProfile } = await supabase
          .from('contractor_profiles')
          .select('partner_status')
          .eq('id', profileId)
          .maybeSingle();

        if (contractorProfile) {
          setPartnerStatus(contractorProfile.partner_status);
        }
      }

      setContractorProfileId(profileId);

      const { data: activeSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select(
          `
          status,
          current_period_start,
          billing_period,
          tier_id,
          tiers (
            id,
            name
          )
        `
        )
        .eq('contractor_id', profileId)
        .eq('status', 'active')
        .maybeSingle();

      if (subError) {
        console.error('Error fetching active subscription:', subError);
      }

      if (activeSubscription) {
        const tiersData = activeSubscription.tiers;
        const tierName = Array.isArray(tiersData)
          ? tiersData[0]?.name
          : (tiersData as any)?.name;

        if (tierName) {
          setCurrentTier(tierName);
        }
        setSubscriptionStartDate(
          activeSubscription.current_period_start
            ? new Date(activeSubscription.current_period_start)
            : null
        );
        const ann = activeSubscription.billing_period === 'annual';
        setIsAnnualSubscription(ann);
        setBillingPeriod(activeSubscription.billing_period);
      } else {
        setCurrentTier(null);
        setSubscriptionStartDate(null);
        setIsAnnualSubscription(false);
        setBillingPeriod(null);
      }
    } catch (error) {
      console.error('Error loading subscription section:', error);
      setErrorMessage('Something went wrong while loading subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = (tier: Tier) => {
    return tier.monthlyPrice * 12 - tier.annualPrice;
  };

  const canAccessAddOn = (addOn: AddOn): boolean => {
    if (!currentTier) return false;

    if (addOn.monthsRequired && subscriptionStartDate) {
      const monthsActive = Math.floor(
        (Date.now() - subscriptionStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      if (monthsActive < addOn.monthsRequired) return false;
    }

    if (addOn.tierRequired) {
      if (addOn.tierRequired.includes('Annual') && !isAnnualSubscription) return false;
      const tierName = addOn.tierRequired.replace(' (Annual only)', '');
      if (currentTier !== tierName) return false;
    }

    return true;
  };

  const handleSelectTier = async (tier: Tier) => {
    try {
      setErrorMessage(null);

      if (!contractorProfileId) {
        setErrorMessage('Unable to identify contractor profile. Refresh and try again.');
        return;
      }

      setCheckoutLoading(`tier-${tier.id}`);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: contractorProfileId,
          tierId: tier.id,
          tierName: tier.name,
          billingPeriod: isAnnual ? 'annual' : 'monthly',
          isAddOn: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Unable to create checkout session.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setErrorMessage('No checkout URL was returned.');
    } catch (error) {
      setErrorMessage('An error occurred while starting checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleSelectAddOn = async (addOn: AddOn) => {
    try {
      setErrorMessage(null);

      if (!contractorProfileId) {
        setErrorMessage('Unable to identify contractor profile. Refresh and try again.');
        return;
      }

      setCheckoutLoading(`addon-${addOn.id}`);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: contractorProfileId,
          billingPeriod: addOn.hasSubscription ? (isAnnual ? 'annual' : 'monthly') : 'one_time',
          isAddOn: true,
          addOnId: addOn.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Unable to create add-on checkout session.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setErrorMessage('No checkout URL was returned.');
    } catch (error) {
      setErrorMessage('An error occurred while starting add-on checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
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
      setErrorMessage('Could not open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-lw-rust" />
        </div>
      </Card>
    );
  }

  if (errorMessage && !partnerStatus) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (partnerStatus === PARTNER_STATUS.APPLIED) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 flex-shrink-0">
            <Lock className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-lw-text text-base mb-1">Subscription Locked</h3>
            <p className="text-lw-text/70 text-sm leading-relaxed">
              Your application is currently under review. Once our team approves your application, you'll receive an email with instructions to sign in and choose your partnership plan.
            </p>
            <p className="text-amber-700 text-sm font-medium mt-3">
              Typical review time: 24–48 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (partnerStatus === PARTNER_STATUS.REJECTED) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-lw-text text-base mb-1">Application Not Approved</h3>
            <p className="text-lw-text/70 text-sm leading-relaxed">
              Your application was not approved at this time. Contact{' '}
              <a href="mailto:adeyo@listworx.co" className="text-lw-rust hover:underline">
                adeyo@listworx.co
              </a>{' '}
              for details or to discuss next steps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (partnerStatus === PARTNER_STATUS.PAUSED) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lw-text text-base mb-1">Subscription Paused</h3>
            <p className="text-lw-text/70 text-sm leading-relaxed mb-4">
              Your subscription is past due or was paused. Update your payment method to resume receiving leads immediately.
            </p>
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="bg-lw-rust hover:bg-lw-rust-hover text-white gap-2"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Update Payment & Reactivate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (partnerStatus === PARTNER_STATUS.ACTIVE && currentTier) {
    const tierDef = TIERS.find(
      (t) => t.name.toLowerCase() === currentTier.toLowerCase()
    );
    const TierIcon = tierDef?.icon || Shield;
    const isElite = currentTier.toLowerCase().includes('elite');
    const isBasicOrPreferred =
      currentTier.toLowerCase().includes('basic') ||
      currentTier.toLowerCase().includes('preferred');

    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-lw-border-light bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex-shrink-0">
                <TierIcon className="h-6 w-6 text-lw-rust" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lw-text text-lg">{currentTier}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <p className="text-lw-text/60 text-sm mt-1">
                  {billingPeriod === 'annual' ? 'Annual billing' : 'Monthly billing'}
                  {subscriptionStartDate && (
                    <> · Member since {subscriptionStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                variant="outline"
                size="sm"
                className="border-lw-border-light text-lw-text hover:bg-lw-surface hover:text-lw-rust gap-2"
              >
                {portalLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                Manage Billing
              </Button>
              {isBasicOrPreferred && (
                <Button
                  onClick={() => {
                    const nextTier = currentTier.toLowerCase().includes('basic')
                      ? TIERS.find((t) => t.id === 'preferred')
                      : TIERS.find((t) => t.id === 'elite');
                    if (nextTier) handleSelectTier(nextTier);
                  }}
                  size="sm"
                  className="bg-lw-rust hover:bg-lw-rust-hover text-white gap-2"
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                  )}
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-5">
            <h3 className="text-lg font-bold text-lw-text">Optional Add-Ons</h3>
            <p className="text-lw-text/50 text-sm mt-0.5">
              Enhance your partnership with premium features
            </p>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <Label
              htmlFor="addon-billing-toggle"
              className={!isAnnual ? 'text-lw-text font-medium text-sm' : 'text-lw-text/50 text-sm'}
            >
              Monthly
            </Label>
            <Switch
              id="addon-billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label
              htmlFor="addon-billing-toggle"
              className={isAnnual ? 'text-lw-text font-medium text-sm' : 'text-lw-text/50 text-sm'}
            >
              Annual
            </Label>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs">
              Save 17%
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ADD_ONS.map((addOn) => {
              const Icon = addOn.icon;
              const canAccess = canAccessAddOn(addOn);
              const loadingThisAddOn = checkoutLoading === `addon-${addOn.id}`;
              const displayPrice = addOn.hasSubscription
                ? isAnnual
                  ? addOn.annualPrice
                  : addOn.monthlyPrice
                : addOn.monthlyPrice;

              return (
                <div
                  key={addOn.id}
                  className={`rounded-2xl border p-5 bg-white ${
                    canAccess ? 'border-lw-border-light' : 'border-lw-border-light opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-lw-surface border border-lw-border-light flex-shrink-0">
                      <Icon className="h-5 w-5 text-lw-rust" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lw-text text-sm leading-snug">{addOn.name}</h4>
                      {addOn.hasSubscription ? (
                        <>
                          <p className="font-bold text-lw-text mt-0.5">
                            ${isAnnual ? addOn.annualPrice : addOn.monthlyPrice}
                            <span className="text-xs font-normal text-lw-text/50">
                              {isAnnual ? '/yr' : '/mo'}
                            </span>
                          </p>
                          {isAnnual && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5">
                              Save ${(addOn.monthlyPrice || 0) * 12 - (addOn.annualPrice || 0)}/year
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-bold text-lw-text mt-0.5">${displayPrice}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-lw-text/60 mb-3">{addOn.description}</p>

                  {addOn.eligibility && (
                    <div className="mb-3 rounded-lg border border-lw-border-light bg-lw-surface p-2.5">
                      <p className="text-xs text-lw-text/50">{addOn.eligibility}</p>
                    </div>
                  )}

                  <Button
                    className={`w-full text-sm ${
                      canAccess
                        ? 'bg-lw-rust hover:bg-lw-rust-hover text-white'
                        : 'border-lw-border-light text-lw-text/40'
                    }`}
                    size="sm"
                    disabled={!canAccess || loadingThisAddOn}
                    variant={canAccess ? 'default' : 'outline'}
                    onClick={() => handleSelectAddOn(addOn)}
                  >
                    {loadingThisAddOn ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Starting checkout...
                      </>
                    ) : canAccess ? (
                      addOn.hasSubscription
                        ? isAnnual
                          ? 'Subscribe Annually'
                          : 'Subscribe Monthly'
                        : 'Purchase Now'
                    ) : (
                      'Not Available'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (partnerStatus === PARTNER_STATUS.APPROVED) {
    return (
      <div className="space-y-10">
        <div>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-xl font-bold text-lw-text">Choose Your Plan</h2>
              <p className="text-lw-text/60 text-sm mt-0.5">
                Your application is approved. Select a plan to activate your account.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-lw-border-light rounded-lg px-3 py-2 bg-white self-start">
              <Label
                htmlFor="dashboard-billing-toggle"
                className={!isAnnual ? 'text-lw-text font-medium text-sm' : 'text-lw-text/50 text-sm'}
              >
                Monthly
              </Label>
              <Switch
                id="dashboard-billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label
                htmlFor="dashboard-billing-toggle"
                className={isAnnual ? 'text-lw-text font-medium text-sm' : 'text-lw-text/50 text-sm'}
              >
                Annual
              </Label>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                Save 17%
              </Badge>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const displayPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const savings = calculateSavings(tier);
            const loadingThisTier = checkoutLoading === `tier-${tier.id}`;

            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border p-6 bg-white ${
                  tier.highlight
                    ? 'border-lw-rust shadow-md'
                    : 'border-lw-border-light shadow-sm'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-lw-rust text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className="h-11 w-11 rounded-xl bg-lw-rust/10 border border-lw-rust/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-lw-rust" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lw-text text-base leading-snug">{tier.name}</h3>
                    {tier.badgeText && (
                      <span className="text-xs text-lw-text/50 font-medium">{tier.badgeText}</span>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-lw-text">${displayPrice}</span>
                    <span className="text-lw-text/50 text-sm">{isAnnual ? '/yr' : '/mo'}</span>
                  </div>
                  <p className="text-xs text-lw-text/50 mt-1">
                    {isAnnual
                      ? `$${tier.annualPrice}/yr billed annually`
                      : `$${tier.monthlyPrice}/mo billed monthly`}
                  </p>
                  {isAnnual && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Save ${savings}/year</p>
                  )}
                </div>

                <Button
                  className={`w-full mb-5 font-semibold ${
                    tier.highlight
                      ? 'bg-lw-rust hover:bg-lw-rust-hover text-white'
                      : 'bg-lw-text hover:bg-[#1a1a1a] text-white'
                  }`}
                  disabled={loadingThisTier}
                  onClick={() => handleSelectTier(tier)}
                >
                  {loadingThisTier ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting checkout...
                    </>
                  ) : isAnnual ? (
                    `Start Annual — $${tier.annualPrice}/yr`
                  ) : (
                    `Start Monthly — $${tier.monthlyPrice}/mo`
                  )}
                </Button>

                <div className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-lw-text/80">{feature}</span>
                    </div>
                  ))}
                  {tier.unavailableFeatures?.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 opacity-50">
                      <CircleIcon className="h-4 w-4 text-lw-text/30 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-lw-text/50">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
