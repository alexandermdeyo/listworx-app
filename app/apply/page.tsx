'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  MapPin,
  Star,
  LayoutDashboard,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

async function waitForSession(
  supabase: ReturnType<typeof createClient>,
  attempts = 20,
  delayMs = 250
) {
  for (let i = 0; i < attempts; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return null;
}

export default function ApplyPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function friendlyAuthError(msg: string): string {
    const m = (msg || '').toLowerCase();

    if (
      m.includes('already registered') ||
      m.includes('already been registered') ||
      m.includes('user already exists')
    ) {
      return 'An account with this email already exists. Use Sign In instead.';
    }

    if (
      m.includes('password') &&
      (m.includes('short') || m.includes('weak') || m.includes('characters'))
    ) {
      return 'Password is too short. Minimum 6 characters required.';
    }

    if (m.includes('invalid email') || m.includes('valid email')) {
      return 'Please enter a valid email address.';
    }

    if (m.includes('rate limit') || m.includes('too many')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }

    if (m.includes('network') || m.includes('fetch')) {
      return 'Network error. Check your connection and try again.';
    }

    return msg || 'Something went wrong. Please try again.';
  }

  async function ensureUserRecord(userId: string, userEmail: string) {
    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: userId,
        email: userEmail.trim().toLowerCase(),
        role: 'CONTRACTOR',
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('USERS UPSERT FAILED:', upsertError);
      throw new Error(upsertError.message || 'Failed to create contractor user record.');
    }
  }

  async function attachExistingProfileByEmail(userId: string, userEmail: string) {
    const normalizedEmail = userEmail.trim().toLowerCase();

    const { data: existingByEmail, error: existingByEmailError } = await supabase
      .from('contractor_profiles')
      .select('id, user_id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingByEmailError) {
      console.error('PROFILE LOOKUP BY EMAIL FAILED:', existingByEmailError);
      throw new Error(existingByEmailError.message || 'Failed to check contractor email.');
    }

    if (existingByEmail && !existingByEmail.user_id) {
      const { error: attachError } = await supabase
        .from('contractor_profiles')
        .update({ user_id: userId, email: normalizedEmail })
        .eq('id', existingByEmail.id);

      if (attachError) {
        console.error('PROFILE ATTACH FAILED:', attachError);
        throw new Error(attachError.message || 'Failed to connect contractor profile.');
      }
    }
  }

  async function finishSignUpFlow(userEmail: string, fallbackUserId?: string) {
    const normalizedEmail = userEmail.trim().toLowerCase();

    let session = await waitForSession(supabase);

    if (!session?.user?.id && password) {
      const { error: retrySignInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (retrySignInError) {
        console.error('RETRY SIGNIN FAILED:', retrySignInError);
      }

      session = await waitForSession(supabase);
    }

    const finalUserId = session?.user?.id || fallbackUserId;

    if (!finalUserId) {
      throw new Error('Session not ready after authentication.');
    }

    await ensureUserRecord(finalUserId, normalizedEmail);
    await attachExistingProfileByEmail(finalUserId, normalizedEmail);

    window.location.href = '/apply';
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { role: 'CONTRACTOR' },
        },
      });

      if (signUpError) {
        setError(friendlyAuthError(signUpError.message));
        setLoading(false);
        return;
      }

      if (!data.user?.id) {
        setError('Signup did not return a user. Please try again or contact support.');
        setLoading(false);
        return;
      }

      await finishSignUpFlow(normalizedEmail, data.user.id);
    } catch (err: any) {
      console.error('CONTRACTOR SIGNUP FLOW FAILED:', err);
      setError(`Unexpected error. Please try again. (${err.message})`);
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (loginError) {
        const m = (loginError.message || '').toLowerCase();

        if (
          m.includes('invalid login') ||
          m.includes('invalid credentials') ||
          m.includes('wrong password')
        ) {
          setError('Incorrect email or password. Please try again.');
        } else if (m.includes('email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else {
          setError(friendlyAuthError(loginError.message));
        }

        setLoading(false);
        return;
      }

      if (!data.user?.id) {
        setError('Login did not return a user. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = '/contractor-dashboard';
    } catch (err: any) {
      console.error('CONTRACTOR LOGIN FLOW FAILED:', err);
      setError(`Unexpected error. Please try again. (${err.message})`);
      setLoading(false);
    }
  }

  const benefits = [
    { icon: MapPin, text: 'Receive pre-qualified leads in your service area' },
    { icon: Shield, text: 'IronClad Certified Partner badge and recognition' },
    { icon: Star, text: 'Featured in our verified contractor directory' },
    { icon: LayoutDashboard, text: 'Full dashboard for leads, docs, and subscriptions' },
  ];

  const steps = [
    'Create your account and go straight into your application',
    'Fill out your application: trades, counties, compliance docs',
    'Our team reviews your application within 24–48 hours',
    'Once approved, choose a plan and start receiving leads',
  ];

  return (
    <div className="min-h-screen bg-lw-surface">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-lw-rust/10 border border-lw-rust/30 text-lw-rust text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            IronClad Partner Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-lw-text mb-3 tracking-tight">
            Become a ListWorx Partner
          </h1>
          <p className="text-lg text-lw-text/60 max-w-xl mx-auto">
            Join our network of vetted contractors and start receiving qualified leads from real estate professionals.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-lw-surface-card rounded-2xl border border-lw-border-light p-5 shadow-sm">
              <h3 className="font-bold text-lw-text text-sm mb-4 uppercase tracking-wide">
                Partnership Benefits
              </h3>
              <ul className="space-y-3">
                {benefits.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-lw-rust/10 border border-lw-rust/20 flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-lw-rust" />
                    </div>
                    <span className="text-lw-text/70 text-sm leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {mode === 'signup' && (
              <div className="bg-lw-surface-card rounded-2xl border border-lw-border-light p-5 shadow-sm">
                <h3 className="font-bold text-lw-text text-sm mb-4 uppercase tracking-wide">
                  What Happens Next
                </h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-lw-rust text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-lw-text/60 leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="bg-lw-surface-card rounded-2xl border border-lw-border-light overflow-hidden shadow-sm">
              <div className="flex border-b border-lw-border-light">
                {(['signup', 'login'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setError('');
                    }}
                    className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                      mode === m
                        ? 'border-lw-rust text-lw-rust'
                        : 'border-transparent text-lw-text/40 hover:text-lw-text'
                    }`}
                  >
                    {m === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                ))}
              </div>

              <div className="p-7">
                <div className="mb-6">
                  {mode === 'signup' ? (
                    <>
                      <h2 className="text-2xl font-bold text-lw-text mb-1">Create Your Account</h2>
                      <p className="text-lw-text/50 text-sm">
                        Sign up to start your contractor application.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-lw-text mb-1">Welcome Back</h2>
                      <p className="text-lw-text/50 text-sm">
                        Sign in to access your contractor dashboard.
                      </p>
                    </>
                  )}
                </div>

                {error && (
                  <Alert className="mb-5 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-4">
                  <div>
                    <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contractor@example.com"
                      required
                      disabled={loading}
                      autoComplete="email"
                      className="border-lw-border-light text-lw-text placeholder:text-lw-text/30 focus:border-lw-rust h-11"
                    />
                  </div>

                  <div>
                    <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter your password'}
                        required
                        disabled={loading}
                        minLength={mode === 'signup' ? 6 : undefined}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        className="border-lw-border-light text-lw-text placeholder:text-lw-text/30 focus:border-lw-rust h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-lw-text/30 hover:text-lw-text transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          required
                          disabled={loading}
                          minLength={6}
                          autoComplete="new-password"
                          className="border-lw-border-light text-lw-text placeholder:text-lw-text/30 focus:border-lw-rust h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-lw-text/30 hover:text-lw-text transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : mode === 'signup' ? (
                      <>
                        Create Account & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Sign In to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-center text-xs text-lw-text/40 mt-5">
                  By creating an account, you agree to our{' '}
                  <Link
                    href="/terms"
                    className="text-lw-text/60 hover:text-lw-rust transition-colors"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-lw-text/60 hover:text-lw-rust transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}