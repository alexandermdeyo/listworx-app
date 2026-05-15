'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Loader as Loader2, ArrowLeft, Check } from 'lucide-react';
import { ADDON_LIST } from '@/lib/tiers-config';

export default function AddonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const addonId = params.id as string;

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/login?redirect=/contractor-dashboard/addons/${addonId}`); return; }
      const { data: prof } = await supabase.from('contractor_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      setProfile(prof || {});
      setLoading(false);
    };
    init();
  }, [addonId]);

  const addon = ADDON_LIST.find(a => a.id === addonId);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
    </div>
  );

  if (!addon) return (
    <div className="min-h-screen bg-zinc-950 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push('/contractor-dashboard')} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <h1 className="text-xl font-bold text-white mb-3">Add-on Not Found</h1>
        <p className="text-zinc-400">We couldn&apos;t find an add-on with that ID.</p>
      </div>
    </div>
  );

  const tier = (profile?.tier || '').toLowerCase() as 'basic' | 'preferred' | 'elite';
  const includedIn: string[] = (addon.includedIn as string[]) || [];
  const isIncluded = includedIn.includes(tier) && profile?.subscription_status === 'active';

  const price = tier === 'elite' && (addon as any).elitePrice != null
    ? (addon as any).elitePrice
    : addon.price;

  const priceLabel = addon.type === 'monthly' ? `$${price}/month` : `$${price} one-time`;

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/contractor-dashboard')} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{addon.name}</h1>
            <p className="text-[#E8621A] font-semibold text-lg">{priceLabel}</p>
          </div>

          {isIncluded && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 border border-emerald-700/40 px-4 py-3">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 text-sm font-medium">Included with your {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</span>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">What you get</h2>
              <p className="text-zinc-300 leading-relaxed">{addon.description}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-2">Availability</h2>
              {includedIn.length > 0 ? (
                <p className="text-zinc-300">
                  Included with:{' '}
                  {includedIn.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} plan{includedIn.length > 1 ? 's' : ''}.
                  Available as an add-on for all other tiers.
                </p>
              ) : (
                <p className="text-zinc-300">Available as an add-on for all tiers.</p>
              )}
            </div>
          </div>

          {!isIncluded && (
            <Button
              onClick={() => router.push(`/contractor-dashboard?openAddon=${addonId}`)}
              className="w-full bg-[#E8621A] hover:bg-[#d45516] text-white py-3 text-base"
            >
              {addon.type === 'monthly' ? 'Subscribe' : 'Purchase'} — {priceLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
