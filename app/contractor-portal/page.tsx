'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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

export default function ContractorPortalPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('signin');

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
  const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));

  const handleEmailChange = (nextEmail: string) => {
    setSignInEmail(nextEmail);
    setSignUpEmail(nextEmail);
  };

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      setSignInEmail(decodedEmail);
      setSignUpEmail(decodedEmail);
      setActiveTab('signin');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!signInEmail || !signInPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setMessage('Signed in successfully! Redirecting...');
      setTimeout(() => { window.location.href = redirectTarget; }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
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
    try {
      const response = await fetch('/api/set-contractor-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signUpEmail, password: signUpPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('No application found with this email. Please submit an application first at /apply');
        } else {
          setError(data.error || 'Failed to create account');
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (signInError) {
        setError('Account created, but auto-login failed. Please sign in manually.');
        setActiveTab('signin');
        handleEmailChange(signUpEmail);
        return;
      }

      setMessage('Account created successfully! Redirecting...');
      setTimeout(() => { window.location.href = redirectTarget; }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-lw-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl bg-lw-surface-card">
        <CardHeader className="text-center pb-6">
          <Link href="/">
            <Image
              src="/Listworx_wordmark_logo.png"
              alt="ListWorx"
              width={200}
              height={40}
              className="h-12 w-auto mx-auto mb-6"
            />
          </Link>
          <CardTitle className="text-3xl font-bold">Contractor Portal</CardTitle>
          <CardDescription className="text-base mt-2">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="mb-6 border-green-500 bg-green-50 text-green-900">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    disabled={loading}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signin-password" className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lw-text/40 hover:text-lw-text transition-colors"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
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

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    disabled={loading}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="signup-password" className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4" />
                    Create Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      disabled={loading}
                      placeholder="At least 8 characters"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lw-text/40 hover:text-lw-text transition-colors"
                      tabIndex={-1}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-confirm" className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showSignUpConfirm ? 'text' : 'password'}
                      value={signUpConfirm}
                      onChange={(e) => setSignUpConfirm(e.target.value)}
                      disabled={loading}
                      placeholder="Type your password again"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-lw-text/40 hover:text-lw-text transition-colors"
                      tabIndex={-1}
                    >
                      {showSignUpConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
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

        <CardFooter className="flex flex-col gap-3 pt-6 border-t">
          <p className="text-sm text-lw-text/60 text-center">
            Need help? Contact us at{' '}
            <a href="mailto:support@listworx.com" className="text-lw-rust hover:underline">
              support@listworx.com
            </a>
          </p>
          <Link href="/" className="text-sm text-lw-text/60 hover:text-lw-rust transition-colors text-center">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
