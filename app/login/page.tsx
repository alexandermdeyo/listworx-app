'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Loader as Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Role = 'ADMIN' | 'CONTRACTOR' | 'USER' | null;

function getDefaultRoute(role: Role) {
  if (role === 'ADMIN') return '/admin/crm';
  if (role === 'CONTRACTOR') return '/contractor-dashboard';
  return '/requestor-dashboard';
}

function sanitizeRedirect(redirect: string | null, role: Role) {
  const fallback = getDefaultRoute(role);

  if (!redirect || typeof redirect !== 'string') {
    return fallback;
  }

  const trimmed = redirect.trim();

  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/login') ||
    trimmed.startsWith('/signup') ||
    trimmed.startsWith('/logout')
  ) {
    return fallback;
  }

  if (role === 'ADMIN') {
    return trimmed.startsWith('/admin') ? trimmed : fallback;
  }

  if (role === 'CONTRACTOR') {
    if (
      trimmed.startsWith('/contractor-dashboard') ||
      trimmed.startsWith('/billing') ||
      trimmed.startsWith('/apply')
    ) {
      return trimmed;
    }
    return fallback;
  }

  if (role === 'USER') {
    if (
      trimmed.startsWith('/requestor-dashboard') ||
      trimmed.startsWith('/request')
    ) {
      return trimmed;
    }
    return fallback;
  }

  return fallback;
}

export default function LoginPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendingMagic, setSendingMagic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('Login failed.');
      }

      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (appUserError) {
        throw new Error(appUserError.message || 'Could not load account role.');
      }

      const role = (appUser?.role as Role) || null;
      const nextRoute = sanitizeRedirect(redirect, role);

      // Force a full browser navigation so protected-route middleware
      // sees the settled auth session/cookies.
      window.location.href = nextRoute;
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter your email address first.');
      return;
    }

    setSendingMagic(true);

    try {
      const safeRedirect = redirect && redirect.startsWith('/') ? redirect : '';
      const emailRedirectTo = safeRedirect
        ? `${window.location.origin}/login?redirect=${encodeURIComponent(safeRedirect)}`
        : `${window.location.origin}/login`;

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setMessage('Magic link sent. Check your email.');
    } catch (err: any) {
      setError(err.message || 'Could not send magic link.');
    } finally {
      setSendingMagic(false);
    }
  }

  return (
    <div className="min-h-screen bg-lw-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src="/Listworx_wordmark_logo.png"
              alt="ListWorx"
              width={220}
              height={44}
              className="h-12 w-auto mx-auto mb-6"
            />
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to access your account</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || sendingMagic}
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || sendingMagic}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="my-4 text-center text-sm text-muted-foreground">or</div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleMagicLink}
          disabled={sendingMagic}
        >
          {sendingMagic ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Magic Link...
            </>
          ) : (
            'Sign in with Magic Link'
          )}
        </Button>

        <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
          Need a requestor account?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </div>
      </Card>
    </div>
  );
}