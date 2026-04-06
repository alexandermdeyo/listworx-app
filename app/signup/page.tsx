'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ensureProfile(userId: string, userEmail: string) {
    const { data: existing } = await supabase
      .from('contractor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return;

    const { error } = await supabase.from('contractor_profiles').insert({
      user_id: userId,
      email: userEmail.trim().toLowerCase(),
      partner_status: 'applied',
      company_name: '',
      owner_name: '',
      phone: '',
    });

    if (error) {
      console.error('PROFILE INSERT FAILED:', error);
      throw new Error('Failed to create contractor profile');
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError) throw signUpError;

      // 🔥 CRITICAL: wait for session
      let sessionUser = null;

      for (let i = 0; i < 15; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          sessionUser = session.user;
          break;
        }

        await new Promise((res) => setTimeout(res, 200));
      }

      if (!sessionUser) {
        throw new Error('Session not ready after signup');
      }

      const userId = sessionUser.id;

      // create user record
      const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: normalizedEmail,
        role: 'CONTRACTOR',
      });

      if (userError) {
        console.error('USER UPSERT FAILED:', userError);
        throw new Error('Failed to create user record');
      }

      // create contractor profile
      await ensureProfile(userId, normalizedEmail);

      // go to application (NOT dashboard yet)
      window.location.href = '/apply';
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lw-dark text-white">
      <form
        onSubmit={handleSignup}
        className="bg-zinc-900 p-8 rounded-xl w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold">Create Contractor Account</h1>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          className="w-full bg-lw-rust hover:bg-lw-rust-hover"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}