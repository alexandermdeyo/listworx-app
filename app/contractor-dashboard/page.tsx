'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Navigation from '@/components/Navigation';
import { Loader2 } from 'lucide-react';

export default function ContractorDashboard() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = '/login?redirect=/contractor-dashboard';
        return;
      }

      const userId = session.user.id;

      // GET ROLE
      const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (appUser?.role !== 'CONTRACTOR') {
        window.location.href = '/';
        return;
      }

      // GET CONTRACTOR PROFILE
      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('partner_status')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile) {
        window.location.href = '/apply';
        return;
      }

      const status = (profile.partner_status || '').toLowerCase();

      // ROUTING LOGIC (SINGLE SOURCE OF TRUTH)
      if (status === 'applied' || status === 'under_review') {
        window.location.href = '/apply';
        return;
      }

      if (status === 'approved') {
        window.location.href = '/billing';
        return;
      }

      if (status !== 'active') {
        window.location.href = '/apply';
        return;
      }

      // ONLY ACTIVE CONTRACTORS GET HERE
      setLoading(false);
    } catch (err) {
      console.error('Auth error:', err);
      window.location.href = '/login';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lw-dark text-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-lw-rust" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-dark text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-6">
          Contractor Dashboard
        </h1>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <p className="text-zinc-300">
            You are ACTIVE. This means:
          </p>

          <ul className="mt-4 space-y-2 text-zinc-400 text-sm">
            <li>• You will receive referrals</li>
            <li>• Your profile is visible</li>
            <li>• You are part of ListWorx network</li>
          </ul>
        </div>
      </div>
    </div>
  );
}