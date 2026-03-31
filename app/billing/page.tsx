'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CircleCheck as CheckCircle,
  Shield,
  Zap,
  Crown,
  Truck,
  Star,
  CircleAlert as AlertCircle,
  Loader as Loader2,
  CreditCard,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import BillingPortal from './BillingPortal';

interface Tier {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  icon: any;
  highlight?: boolean;
  description: string;
}

const TIERS: Tier[] = [
  {
    id: 'basic',
    name: 'Basic Partner',
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: Shield,
    description: 'Essential partnership features to get started',
    features: [
      'IronClad Standards™ badge',
      'Profile in contractor directory',
      'Lead referrals in your market',
      'Basic dashboard access',
      'Email support',
      'Performance tracking',
    ],
  },
  {
    id: 'preferred',
    name: 'Preferred Partner',
    monthlyPrice: 349,
    annualPrice: 3590,
    icon: Zap,
    description: 'Enhanced visibility and priority placement',
    features: [
      'Everything in Basic',
      'Priority lead routing',
      'Enhanced profile placement',
      'Advanced analytics',
      'Priority email support',
      'Quarterly performance reviews',
      'Marketing resources',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Partner',
    monthlyPrice: 599,
    annualPrice: 5990,
    icon: Crown,
    highlight: true,
    description: 'Maximum exposure and premium benefits',
    features: [
      'Everything in Preferred',
      'Top priority lead routing',
      'Featured homepage placement',
      'Dedicated account manager',
      'Phone + email support',
      'Monthly strategy calls',
      'Exclusive marketing opportunities',
      'Access to exclusive add-ons',
    ],
  },
];

interface AddOn {
  id: string;
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

const ADD_ONS: AddOn[] = [
  {
    id: 'ironclad_badge_kit',
    name: 'IronClad Badge & Decal Kit',
    description: 'Physical truck decal + digital badge pack for website & social media',
    monthlyPrice: 599,
    icon: Truck,
    eligibility: 'One-time purchase • Requires active subscription',
    hasSubscription: false,
  },
  {
    id: 'territory_lock',
    name: 'Territory Lock Add-On',
    description: 'Lock a defined service area for your specific trade - exclusive market protection',
    monthlyPrice: 399,
    annualPrice: 3990,
    icon: Shield,
    eligibility: 'Available as monthly or annual subscription',
    hasSubscription: true,
  },
  {
    id: 'featured_spotlight',
    name: 'Featured Partner Spotlight',
    description: 'Featured marketing promotion placement on homepage and social channels',
    monthlyPrice: 299,
    annualPrice: 2990,
    icon: Star,
    eligibility: 'Available as monthly or annual subscription',
    hasSubscription: true,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<Date | null>(null);
  const [isAnnualSubscription, setIsAnnualSubscription] = useState(false);
  const [contractorProfileId, setContractorProfileId] = useState<string | null>(null);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  useEffect(() => {
    router.refresh();
    checkPartnerStatus();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      partnerStatus &&
      partnerStatus !== 'approved' &&
      partnerStatus !== 'active' &&
      partnerStatus !== 'SYNC_ERROR' &&
      partnerStatus !== 'NO_PROFILE' &&
      autoRefreshCount < 3
    ) {
      const timer = setTimeout(() => {
        setAutoRefreshCount((prev) => prev + 1);
        router.refresh();
        checkPartnerStatus();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, partnerStatus, autoRefreshCount, router]);

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel('contractor-status-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'contractor_profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newStatus = payload.new?.partner_status;

            if (newStatus === 'approved' || newStatus === 'active') {
              setPartnerStatus(newStatus);
              setTimeout(() => {
                window.location.reload();
              }, 500);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const checkPartnerStatus = async () => {
    try {
      setLoading(true);

      const { createClient } = await import('@/lib/supabase-browser');
      const supabase = createClient();

      let user = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!user && attempts < maxAttempts) {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        user = currentUser;

        if (!user && attempts < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
        } else {
          break;
        }
      }

      if (!user) {
        setPartnerStatus(null);
        setCurrentTier(null);
        return;
      }

      const { data: userRecord } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .maybeSingle();

      if (!userRecord) {
        setPartnerStatus('SYNC_ERROR');
        setCurrentTier(null);
        return;
      }

      const { data: contractorProfile } = await supabase
        .from('contractor_profiles')
        .select('id, partner_status, user_id, company_name, owner_name')
        .eq('user_id', userRecord.id)
        .maybeSingle();

      if (!contractorProfile) {
        setPartnerStatus('NO_PROFILE');
        setCurrentTier(null);
        setContractorProfileId(null);
        return;
      }

      setPartnerStatus(contractorProfile.partner_status);
      setContractorProfileId(contractorProfile.id);

      if (
        contractorProfile.partner_status !== 'approved' &&
        contractorProfile.partner_status !== 'active'
      ) {
        setRedirecting(true);
        window.location.href = '/contractor-dashboard';
        return;
      }

      const { data: activeSubscription } = await supabase
        .from('subscriptions')
        .select(
          `
          status,
          current_period_start,
          billing_period,
          tier_id,
          tiers (
            name
          )
        `
        )
        .eq('contractor_id', contractorProfile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (
        activeSubscription &&
        activeSubscription.tiers &&
        Array.isArray(activeSubscription.tiers) &&
        activeSubscription.tiers.length > 0
      ) {
        setCurrentTier(activeSubscription.tiers[0].name);
        setSubscriptionStartDate(
          activeSubscription.current_period_start
            ? new Date(activeSubscription.current_period_start)
            : null
        );
        setIsAnnualSubscription(activeSubscription.billing_period === 'annual');
      } else if (
        activeSubscription &&
        activeSubscription.tiers &&
        !Array.isArray(activeSubscription.tiers)
      ) {
        setCurrentTier((activeSubscription.tiers as any).name);
        setSubscriptionStartDate(
          activeSubscription.current_period_start
            ? new Date(activeSubscription.current_period_start)
            : null
        );
        setIsAnnualSubscription(activeSubscription.billing_period === 'annual');
      } else {
        setCurrentTier(null);
        setSubscriptionStartDate(null);
        setIsAnnualSubscription(false);
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = (tier: Tier) => {
    const annualEquivalent = tier.monthlyPrice * 12;
    return annualEquivalent - tier.annualPrice;
  };

  const handleSelectTier = async (tier: Tier) => {
    try {
      if (!contractorProfileId) {
        alert('Unable to identify contractor profile. Please refresh the page and try again.');
        return;
      }

      console.log('BILLING DEBUG →', {
        tierName: tier.name,
        tierId: tier.id,
        contractorProfileId,
        billingPeriod: isAnnual ? 'annual' : 'monthly',
        isAddOn: false,
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractorId: contractorProfileId,
          tierId: tier.id,
          tierName: tier.name,
          billingPeriod: isAnnual ? 'annual' : 'monthly',
          isAddOn: false,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert(data.error || 'Unable to create checkout session. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSelectAddOn = async (addOn: AddOn) => {
    try {
      if (!contractorProfileId) {
        alert('Unable to identify contractor profile. Please refresh the page and try again.');
        return;
      }

      console.log('ADD-ON BILLING DEBUG →', {
        addOnId: addOn.id,
        addOnName: addOn.name,
        contractorProfileId,
        billingPeriod: addOn.hasSubscription ? (isAnnual ? 'annual' : 'monthly') : 'one_time',
        isAddOn: true,
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractorId: contractorProfileId,
          tierName: addOn.name,
          billingPeriod: addOn.hasSubscription ? (isAnnual ? 'annual' : 'monthly') : 'one_time',
          isAddOn: true,
          addOnId: addOn.id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert(data.error || 'Unable to create checkout session. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const canAccessAddOn = (addOn: AddOn): boolean => {
    if (addOn.monthsRequired && subscriptionStartDate) {
      const monthsActive = Math.floor(
        (Date.now() - subscriptionStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      if (monthsActive < addOn.monthsRequired) return false;
    }

    if (addOn.tierRequired) {
      if (addOn.tierRequired.includes('Annual') && !isAnnualSubscription) {
        return false;
      }
      const tierName = addOn.tierRequired.replace(' (Annual only)', '');
      if (currentTier !== tierName) return false;
    }

    return true;
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {redirecting ? 'Redirecting to your dashboard...' : 'Loading billing information...'}
          </p>
        </div>
      </div>
    );
  }

  if (partnerStatus !== 'approved' && partnerStatus !== 'active') {
    const isSetupError = partnerStatus === 'SYNC_ERROR' || partnerStatus === 'NO_PROFILE';

    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto p-12 text-center border-2 border-primary/20">
            <div className="flex justify-center mb-6">
              <div
                className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  isSetupError ? 'bg-red-100' : 'bg-primary/10'
                }`}
              >
                <AlertCircle
                  className={`h-10 w-10 ${isSetupError ? 'text-red-600' : 'text-primary'}`}
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              {isSetupError ? 'Account Setup Incomplete' : 'Application Pending Review'}
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              {isSetupError
                ? 'Your account setup is incomplete. Please contact support to resolve this issue.'
                : 'Your application must be approved before selecting a subscription tier.'}
            </p>

            {!isSetupError && (
              <p className="text-muted-foreground mb-8">
                Our team is currently reviewing your application. You&apos;ll receive an email
                notification once your application has been approved and you can select your
                subscription tier.
              </p>
            )}

            {partnerStatus && (
              <div
                className={`mb-6 p-4 border rounded-lg ${
                  isSetupError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <p className={`text-sm ${isSetupError ? 'text-red-700' : 'text-blue-700'}`}>
                  <strong>Current Status:</strong> {partnerStatus}
                </p>
                {isSetupError && (
                  <p className="text-sm text-red-600 mt-2">
                    Error Code:{' '}
                    {partnerStatus === 'SYNC_ERROR' ? 'USER_SYNC_MISSING' : 'PROFILE_NOT_FOUND'}
                  </p>
                )}
              </div>
            )}

            {!isSetupError && (
              <div className="mb-6 flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    window.location.href =
                      window.location.href + '?refresh=' + new Date().getTime();
                  }}
                  variant="outline"
                  size="lg"
                >
                  <Loader2 className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
            )}

            <div className={`mb-6 p-4 rounded-lg ${isSetupError ? 'bg-red-50' : 'bg-muted/50'}`}>
              <p className="text-sm text-muted-foreground">
                <strong>Need help?</strong> Contact us at{' '}
                <a href="mailto:adeyo@listworx.co" className="text-primary hover:underline">
                  adeyo@listworx.co
                </a>{' '}
                or call{' '}
                <a href="tel:615-362-4996" className="text-primary hover:underline">
                  615-362-4996
                </a>
              </p>
              {isSetupError && (
                <p className="text-sm text-red-600 mt-2">
                  Please mention error code: {partnerStatus}
                </p>
              )}
            </div>

            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Return to Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/Ironclad_Cert_Partner_Final_Logo.png"
              alt="IronClad Certified Partner"
              width={200}
              height={200}
              className="w-32 md:w-40 h-auto"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Billing & Subscriptions
          </h1>

          <p className="text-xl text-muted-foreground mb-8">
            Manage your partnership and view invoices
          </p>
        </div>

        <Tabs defaultValue="subscriptions" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Choose Your Partnership Tier
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Select the plan that best fits your business needs
              </p>

              <div className="flex items-center justify-center gap-4 mb-4">
                <Label
                  htmlFor="billing-toggle"
                  className={`text-lg font-medium ${
                    !isAnnual ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Monthly
                </Label>

                <Switch
                  id="billing-toggle"
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                  className="data-[state=checked]:bg-primary"
                />

                <Label
                  htmlFor="billing-toggle"
                  className={`text-lg font-medium ${
                    isAnnual ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Annual
                </Label>

                {isAnnual && (
                  <Badge className="bg-primary text-white">
                    Save up to ${calculateSavings(TIERS[2])}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {isAnnual ? 'Save with annual billing' : 'Flexible monthly billing'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
                const savings = calculateSavings(tier);
                const isCurrentTier = currentTier === tier.name;

                return (
                  <Card
                    key={tier.name}
                    className={`p-8 relative ${
                      tier.highlight
                        ? 'border-2 border-primary shadow-xl scale-105'
                        : 'border border-border'
                    } ${isCurrentTier ? 'ring-2 ring-primary' : ''}`}
                  >
                    {tier.highlight && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1">
                        Best Value
                      </Badge>
                    )}

                    {isCurrentTier && (
                      <Badge className="absolute -top-3 right-4 bg-green-600 text-white px-4 py-1">
                        Current Plan
                      </Badge>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          ${isAnnual ? Math.round(price / 12) : price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>

                      {isAnnual && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            ${price}/year (billed annually)
                          </p>
                          <p className="text-sm text-primary font-semibold">
                            Save ${savings}/year
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className={`w-full mb-6 ${
                        tier.highlight
                          ? 'bg-primary hover:bg-primary/90'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                      disabled={isCurrentTier}
                      onClick={() => handleSelectTier(tier)}
                    >
                      {isCurrentTier ? 'Current Plan' : `Select ${tier.name}`}
                    </Button>

                    <div className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="border-t border-border pt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Optional Add-Ons
                </h2>
                <p className="text-lg text-muted-foreground">
                  Enhance your partnership with premium features
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {ADD_ONS.map((addOn) => {
                  const Icon = addOn.icon;
                  const canAccess = canAccessAddOn(addOn);
                  const displayPrice = addOn.hasSubscription
                    ? isAnnual
                      ? addOn.annualPrice
                      : addOn.monthlyPrice
                    : addOn.monthlyPrice;
                  const monthlySavings = addOn.annualPrice
                    ? addOn.monthlyPrice! * 12 - addOn.annualPrice
                    : 0;

                  return (
                    <Card
                      key={addOn.id}
                      className={`p-6 ${
                        !canAccess ? 'opacity-60' : 'hover:border-primary transition-all'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-2">{addOn.name}</h3>

                          {addOn.hasSubscription ? (
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  $
                                  {isAnnual
                                    ? Math.round((addOn.annualPrice || 0) / 12)
                                    : addOn.monthlyPrice}
                                </span>
                                <span className="text-sm text-muted-foreground">/month</span>
                              </div>

                              {isAnnual && addOn.annualPrice && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ${addOn.annualPrice}/year • Save ${monthlySavings}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-2xl font-semibold text-primary">${displayPrice}</p>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{addOn.description}</p>

                      {addOn.eligibility && (
                        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-xs text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            {addOn.eligibility}
                          </p>
                        </div>
                      )}

                      {addOn.tierRequired && (
                        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-xs text-muted-foreground flex items-start gap-2">
                            <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            Only available to {addOn.tierRequired} subscribers
                          </p>
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!canAccess}
                        variant={canAccess ? 'default' : 'outline'}
                        onClick={() => canAccess && handleSelectAddOn(addOn)}
                      >
                        {canAccess
                          ? addOn.hasSubscription
                            ? `Subscribe ${isAnnual ? 'Annually' : 'Monthly'}`
                            : 'Purchase Now'
                          : 'Not Available'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="mt-16 max-w-4xl mx-auto">
              <Card className="p-8 bg-primary/5 border-primary/20">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Have Questions?
                </h3>
                <p className="text-center text-muted-foreground mb-6">
                  Our team is here to help you choose the right partnership tier for your business.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="lg">
                    Contact Support
                  </Button>
                  <Link href="/ironclad">
                    <Button variant="outline" size="lg">
                      View IronClad Standards
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <BillingPortal />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="bg-background border-t border-border py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-6">
                <Image
                  src="/Listworx_wordmark_Tag_logo.png"
                  alt="ListWorx"
                  width={200}
                  height={60}
                  className="h-16 w-auto mb-4"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">For Realtors</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/request" className="hover:text-primary transition-colors">
                    Request Contractor
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-primary transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#for-realtors" className="hover:text-primary transition-colors">
                    Benefits
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                For Contractors
                <Image
                  src="/Ironclad_Cert_Partner_Final_Logo.png"
                  alt="IronClad Certified"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/apply" className="hover:text-primary transition-colors">
                    Apply to Join
                  </Link>
                </li>
                <li>
                  <Link href="/billing" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/ironclad" className="hover:text-primary transition-colors">
                    IronClad Standards
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 ListWorx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}