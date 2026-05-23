'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

type RequestorRole = 'REALTOR' | 'HOMEOWNER' | 'PROPERTY_MANAGER';

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

export default function SignupPage() {
  const searchParams = useSearchParams();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const redirect = searchParams.get('redirect') || '/request';

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<RequestorRole>('HOMEOWNER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function friendlyAuthError(msg: string): string {
    const m = (msg || '').toLowerCase();

    if (
      m.includes('already registered') ||
      m.includes('already been registered') ||
      m.includes('user already exists')
    ) {
      return 'An account with this email already exists. Use Login instead.';
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

    return msg || 'Something went wrong. Please try again.';
  }

  async function upsertAppUser(
    userId: string,
    userEmail: string,
    userName: string,
    userRole: RequestorRole
  ) {
    const res = await fetch('/api/upsert-app-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        email: userEmail.trim().toLowerCase(),
        name: userName.trim() || userEmail.trim().toLowerCase(),
        role: userRole,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Failed to create requestor user record.');
    }
  }

  async function finishSignupFlow(
    userEmail: string,
    userName: string,
    userRole: RequestorRole,
    fallbackUserId?: string
  ) {
    const normalizedEmail = userEmail.trim().toLowerCase();

    let session = await waitForSession(supabase);

    if (!session?.user?.id && password) {
      const { error: retrySignInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (retrySignInError) {
        console.error('REQUESTOR RETRY SIGNIN FAILED:', retrySignInError);
      }

      session = await waitForSession(supabase);
    }

    const finalUserId = session?.user?.id || fallbackUserId;

    if (!finalUserId) {
      throw new Error('Session not ready after authentication.');
    }

    await upsertAppUser(finalUserId, normalizedEmail, userName, userRole);

    sessionStorage.setItem(
      'listworx_requestor_prefill',
      JSON.stringify({
        name: userName.trim(),
        email: normalizedEmail,
        role: userRole,
      })
    );

    window.location.href = redirect.startsWith('/') ? redirect : '/request';
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

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
      const normalizedName = fullName.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            name: normalizedName,
            full_name: normalizedName,
          },
        },
      });

      if (signUpError) {
        setError(friendlyAuthError(signUpError.message));
        setLoading(false);
        return;
      }

      if (!data.user?.id) {
        setError('Signup did not return a user. Please try again.');
        setLoading(false);
        return;
      }

      await finishSignupFlow(normalizedEmail, normalizedName, role, data.user.id);
    } catch (err: any) {
      console.error('REQUESTOR SIGNUP FLOW FAILED:', err);
      setError(`Unexpected error. Please try again. (${err.message})`);
      setLoading(false);
    }
  }

  return (
    <PageShell surface="dark">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-lw-surface-card rounded-2xl border border-lw-border-light p-8 shadow-sm max-w-xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-lw-text mb-2">
              Create Requestor Account
            </h1>
            <p className="text-lw-text/50 text-sm">
              Create your free account to request a vetted contractor.
            </p>
          </div>

          {error && (
            <Alert className="mb-5 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lw-text/30" />
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  disabled={loading}
                  autoComplete="name"
                  className="border-lw-border-light text-lw-text placeholder:text-lw-text/30 focus:border-lw-rust h-11 pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                I am a...
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RequestorRole)}
                disabled={loading}
                className="w-full rounded-md border border-lw-border-light bg-white px-3 py-2.5 text-sm text-lw-text focus:outline-none focus:ring-2 focus:ring-lw-rust/20 focus:border-lw-rust"
              >
                <option value="HOMEOWNER">Homeowner</option>
                <option value="REALTOR">Realtor</option>
                <option value="PROPERTY_MANAGER">Property Manager</option>
              </select>
            </div>

            <div>
              <Label className="text-lw-text/70 text-sm font-medium mb-1.5 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lw-text/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="border-lw-border-light text-lw-text placeholder:text-lw-text/30 focus:border-lw-rust h-11 pl-10"
                />
              </div>
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
                  placeholder="Minimum 6 characters"
                  required
                  disabled={loading}
                  minLength={6}
                  autoComplete="new-password"
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

            <Button
              type="submit"
              className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account & Continue
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

          <p className="text-center text-sm text-lw-text/50 mt-3">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-lw-rust hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}