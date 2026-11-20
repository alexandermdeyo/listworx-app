'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader as Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function sanitizeRedirect(redirect: string | null) {
  if (!redirect) return '/billing';

  const value = redirect.trim();

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/login') ||
    value.startsWith('/signup') ||
    value.startsWith('/contractor-portal')
  ) {
    return '/billing';
  }

  return value;
}

function normalizePartnerStatus(status?: string | null) {
  return (status || '').toString().trim().toLowerCase();
}

async function waitForSession(
  supabase: ReturnType<typeof createClient>,
  attempts = 20,
  delayMs = 200
) {
  for (let i = 0; i < attempts; i++) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!error && session?.user?.id) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

async function waitForUser(
  supabase: ReturnType<typeof createClient>,
  attempts = 15,
  delayMs = 200
) {
  for (let i = 0; i < attempts; i++) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user?.id) {
      return user;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

function getContractorSignInDestination() {
  return '/contractor-dashboard';
}

async function resolveContractorDestination(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const [{ data: appUser, error: appUserError }, { data: contractorProfile, error: contractorProfileError }] =
    await Promise.all([
      supabase.from('users').select('role').eq('id', userId).maybeSingle(),
      supabase
        .from('contractor_profiles')
        .select('id, partner_status')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  if (appUserError) {
    console.error('[contractor-portal] role lookup failed', {
      userId,
      error: appUserError,
    });
  }

  if (contractorProfileError) {
    console.error('[contractor-portal] contractor profile lookup failed', {
      userId,
      error: contractorProfileError,
    });
  }

  const role = (appUser?.role || '').toString().toUpperCase();
  const hasContractorProfile = !!contractorProfile;
  const partnerStatus = normalizePartnerStatus(contractorProfile?.partner_status);
  const destination = getContractorSignInDestination();

  console.log('[contractor-portal] contractor resolution', {
    userId,
    role,
    hasContractorProfile,
    partnerStatus: partnerStatus || null,
    destination,
  });

  return destination;
}



async function signInWithRetry(
  supabase: ReturnType<typeof createClient>,
  email: string,
  password: string,
  attempts = 4,
  delayMs = 300
) {
  let lastError: any = null;

  for (let i = 0; i < attempts; i++) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      return { error: null };
    }

    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
  }

  return { error: lastError };
}

export default function ContractorPortalPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('signup');
  const hasInitializedFromQuery = useRef(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const modeParam = searchParams.get('mode');
  const emailParam = searchParams.get('email');
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect')); // kept for handoff/sanitization behavior

  const handleEmailChange = (nextEmail: string) => {
    setSignInEmail(nextEmail);
    setSignUpEmail(nextEmail);
  };

  useEffect(() => {
    if (hasInitializedFromQuery.current) return;
    hasInitializedFromQuery.current = true;

    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      handleEmailChange(decodedEmail);
    }

    if (modeParam === 'login') {
      setActiveTab('signin');
    }
  }, [emailParam, modeParam]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!signInEmail || !signInPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    console.log('[contractor-portal] submit start', {
      authContext: 'signin',
      activeTab,
      email: signInEmail,
    });
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim().toLowerCase(),
        password: signInPassword,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const authUser = await waitForUser(supabase);

      if (!authUser?.id) {
        throw new Error('Login succeeded, but authenticated user data did not load.');
      }

      console.log('[contractor-portal] auth success', {
        authContext: 'signin',
        userId: authUser.id,
      });

      const destination = await resolveContractorDestination(supabase, authUser.id);

      setMessage('Signed in successfully! Redirecting...');
      console.log('[contractor-portal] redirecting after signin', {
        authContext: 'signin',
        activeTabBeforeRedirect: activeTab,
        chosenDestination: destination,
        redirectTarget,
      });
      window.location.assign(destination);
      return;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('[contractor-portal] signin failed', {
        activeTabAfterError: activeTab,
        error: err,
      });
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!signUpEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (signUpPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (signUpPassword !== signUpConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    console.log('[contractor-portal] submit start', {
      authContext: 'signup',
      activeTab,
      email: signUpEmail,
    });
    try {
      const response = await fetch('/api/set-contractor-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signUpEmail.trim().toLowerCase(), password: signUpPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      const normalizedSignUpEmail = signUpEmail.trim().toLowerCase();
      const { error: signInError } = await signInWithRetry(
        supabase,
        normalizedSignUpEmail,
        signUpPassword
      );

      if (signInError) {
        setError('Account created, but auto-login failed. Please sign in manually.');
        setActiveTab('signin');
        handleEmailChange(normalizedSignUpEmail);
        setLoading(false);
        return;
      }

      const authSession = await waitForSession(supabase);
      const authUser = authSession?.user || (await waitForUser(supabase));

      if (!authUser?.id) {
        setError('Account created, but session could not be confirmed. Please sign in manually.');
        setActiveTab('signin');
        handleEmailChange(normalizedSignUpEmail);
        setLoading(false);
        return;
      }

      console.log('[contractor-portal] auth success', {
        authContext: 'signup',
        userId: authUser.id,
      });

      setMessage('Account created successfully! Redirecting...');
      console.log('[contractor-portal] redirecting after signup', {
        authContext: 'signup',
        activeTabBeforeRedirect: activeTab,
        chosenDestination: '/apply',
        redirectTarget,
      });
      window.location.assign('/apply');
      return;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('[contractor-portal] signup failed', {
        activeTabAfterError: activeTab,
        error: err,
      });
      setLoading(false);
    }
  };

  const isSignUp = activeTab === 'signup';

  // Explicit colors on purpose: the site's global theme sets light text, which
  // made the labels, title, and selected tab invisible on this white card.
  const labelClass = 'mb-1.5 flex items-center gap-2 text-sm font-semibold text-zinc-900';
  const iconClass = 'h-4 w-4 text-zinc-500';
  const eyeButtonClass =
    'absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-900';
  const tabTriggerClass =
    'h-full rounded-md text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900 ' +
    'data-[state=active]:bg-lw-rust data-[state=active]:text-white data-[state=active]:shadow-sm';

  return (
    <div className="min-h-screen bg-lw-surface flex items-start justify-center px-4 py-6 sm:items-center sm:py-10">
      <Card className="w-full max-w-md shadow-xl bg-lw-surface-card text-zinc-900">
        <CardHeader className="space-y-0 px-5 pb-4 pt-6 text-center sm:px-8">
          <Link href="/" className="mx-auto mb-4 inline-block">
            <Image
              src="/brand/listworx-wordmark-light.png"
              alt="ListWorx"
              width={306}
              height={36}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            {isSignUp ? 'Create Your Contractor Account' : 'Sign In to Your Account'}
          </CardTitle>
          {isSignUp ? (
            <div className="mt-2 space-y-1.5">
              <p className="text-base font-semibold text-lw-rust">
                Free to apply. No credit card required.
              </p>
              <CardDescription className="text-sm leading-relaxed text-zinc-700">
                Next step: complete your contractor application with your business details,
                license, insurance, and service area.
              </CardDescription>
            </div>
          ) : (
            <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-700">
              Sign in to continue your application or open your contractor dashboard.
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="px-5 pb-6 sm:px-8">
          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-5 border-green-500 bg-green-50 text-green-900">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-5 grid h-11 w-full grid-cols-2 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1">
              <TabsTrigger value="signin" className={tabTriggerClass}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" className={tabTriggerClass}>Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email" className={labelClass}>
                    <Mail className={iconClass} aria-hidden="true" />
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={signInEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    disabled={loading}
                    placeholder="name@yourcompany.com"
                    className="h-11"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signin-password" className={labelClass}>
                    <Lock className={iconClass} aria-hidden="true" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className={eyeButtonClass}
                      aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-lw-rust text-base font-semibold text-white hover:bg-lw-rust/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email" className={labelClass}>
                    <Mail className={iconClass} aria-hidden="true" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signUpEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    disabled={loading}
                    placeholder="name@yourcompany.com"
                    className="h-11"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password" className={labelClass}>
                    <Lock className={iconClass} aria-hidden="true" />
                    Create Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      disabled={loading}
                      required
                      aria-describedby="signup-password-help"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className={eyeButtonClass}
                      aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p id="signup-password-help" className="mt-1.5 text-sm text-zinc-600">
                    Must be at least 8 characters.
                  </p>
                </div>

                <div>
                  <Label htmlFor="signup-confirm" className={labelClass}>
                    <Lock className={iconClass} aria-hidden="true" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showSignUpConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={signUpConfirm}
                      onChange={(e) => setSignUpConfirm(e.target.value)}
                      disabled={loading}
                      required
                      aria-describedby="signup-confirm-help"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                      className={eyeButtonClass}
                      aria-label={showSignUpConfirm ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showSignUpConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p id="signup-confirm-help" className="mt-1.5 text-sm text-zinc-600">
                    Type the same password again.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-lw-rust text-base font-semibold text-white hover:bg-lw-rust/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account & Continue'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t border-zinc-200 px-5 py-4 sm:px-8">
          <p className="text-center text-sm text-zinc-700">
            Need help? Contact us at{' '}
            <a href="mailto:adeyo@listworx.co" className="font-medium text-lw-rust hover:underline">
              adeyo@listworx.co
            </a>
          </p>
          <Link href="/" className="text-center text-sm text-zinc-700 transition-colors hover:text-lw-rust">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
