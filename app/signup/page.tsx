'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mail,
  Lock,
  User,
  Loader as Loader2,
  Eye,
  EyeOff,
  Building2,
  Home,
  Briefcase,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RequestorRole = 'REALTOR' | 'HOMEOWNER' | 'PROPERTY_MANAGER';

async function waitForSession(supabase: ReturnType<typeof createClient>, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      return session;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return null;
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const redirect = searchParams.get('redirect') || '/requestor-dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requestorRole, setRequestorRole] = useState<RequestorRole>('HOMEOWNER');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function friendlyError(message: string) {
    const msg = (message || '').toLowerCase();

    if (msg.includes('already exists')) {
      return 'An account with this email already exists. Sign in instead.';
    }

    if (msg.includes('password')) {
      return 'Password must be at least 6 characters.';
    }

    return message || 'Something went wrong. Please try again.';
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (
      (requestorRole === 'REALTOR' || requestorRole === 'PROPERTY_MANAGER') &&
      !companyName.trim()
    ) {
      setError('Please enter your company name.');
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const response = await fetch('/api/requestor-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
          requestorRole,
          companyName: companyName.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(friendlyError(result?.error || `Signup failed with status ${response.status}.`));
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        setError(
          `Your account was created, but sign-in failed: ${
            signInError.message || 'Please go to the login page and sign in.'
          }`
        );
        setLoading(false);
        return;
      }

      const settledSession = await waitForSession(supabase);

      if (!settledSession?.user?.id) {
        setError('Account created, but the session was not ready. Please sign in.');
        setLoading(false);
        return;
      }

      router.replace(redirect);
      router.refresh();
    } catch (err: any) {
      setError(friendlyError(err?.message || 'Something went wrong. Please try again.'));
      setLoading(false);
    }
  }

  const showCompanyField =
    requestorRole === 'REALTOR' || requestorRole === 'PROPERTY_MANAGER';

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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Your Account
          </h1>
          <p className="text-muted-foreground">
            Free requestor account for realtors, homeowners, and property managers.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="requestorRole" className="mb-2 block">
              I am a
            </Label>
            <Select
              value={requestorRole}
              onValueChange={(value: RequestorRole) => setRequestorRole(value)}
            >
              <SelectTrigger id="requestorRole">
                <SelectValue placeholder="Select your account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REALTOR">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Realtor
                  </div>
                </SelectItem>
                <SelectItem value="HOMEOWNER">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Homeowner
                  </div>
                </SelectItem>
                <SelectItem value="PROPERTY_MANAGER">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property Manager
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCompanyField && (
            <div>
              <Label htmlFor="companyName" className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4" />
                {requestorRole === 'REALTOR'
                  ? 'Brokerage / Company Name'
                  : 'Management Company Name'}
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder={
                  requestorRole === 'REALTOR'
                    ? 'Your brokerage or company name'
                    : 'Your management company name'
                }
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>
          )}

          <div>
            <Label htmlFor="name" className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full"
              autoComplete="name"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full"
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            disabled={loading}
            className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white mt-2"
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

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground space-y-2">
          <p>
            Already have an account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Contractors should use the contractor application page.
          </p>
          <Link href="/" className="block hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>
      </Card>
    </div>
  );
}