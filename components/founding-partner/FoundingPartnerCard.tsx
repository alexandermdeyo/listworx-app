'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FOUNDER_TIERS, ADDON_LIST, getAddonPriceForTier } from '@/lib/tiers-config';
import type { FounderTier } from '@/lib/tiers-config';

const FOUNDER_ONETIME_ADDONS = ADDON_LIST.filter(
  (a) => a.type === 'onetime' && a.id !== 'decal_package_standard'
);

const ACTIVATION_FEE = 75;
const LS_KEY = 'lw_founder_selection';

export default function FoundingPartnerCard() {
  const router = useRouter();
  const [selectedTierId, setSelectedTierId] = useState<FounderTier['id']>('preferred_founder');
  const [checkedAddons, setCheckedAddons] = useState<string[]>([]);

  const selectedTier = FOUNDER_TIERS.find((t) => t.id === selectedTierId)!;

  // When tier changes, drop any checked addons that are now included
  function selectTier(tierId: FounderTier['id']) {
    const tier = FOUNDER_TIERS.find((t) => t.id === tierId)!;
    setCheckedAddons((prev) =>
      prev.filter((id) => {
        const addon = ADDON_LIST.find((a) => a.id === id);
        return !addon?.includedIn?.includes(tier.baseTierId);
      })
    );
    setSelectedTierId(tierId);
  }

  function toggleAddon(addonId: string) {
    setCheckedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  const addonsTotal = checkedAddons.reduce((sum, id) => {
    const addon = ADDON_LIST.find((a) => a.id === id);
    if (!addon) return sum;
    return sum + getAddonPriceForTier(addon, selectedTier.baseTierId);
  }, 0);

  const todayTotal = ACTIVATION_FEE + addonsTotal;

  function buildButtonLabel() {
    const tierName = selectedTier.name;
    if (checkedAddons.length === 0) return `Apply as ${tierName} →`;
    const plural = checkedAddons.length === 1 ? '1 Add-on' : `${checkedAddons.length} Add-ons`;
    return `Apply as ${tierName} + ${plural} ($${todayTotal} today) →`;
  }

  function handleApply() {
    const selection = {
      tierId: selectedTierId,
      tierName: selectedTier.name,
      addons: checkedAddons,
      total: todayTotal,
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(selection));
    } catch {
      // storage may be unavailable in private browsing — URL params still carry the data
    }

    const params = new URLSearchParams();
    params.set('tier', selectedTierId);
    if (checkedAddons.length > 0) params.set('addons', checkedAddons.join(','));
    params.set('total', String(todayTotal));

    router.push(`/apply?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border-2 border-lw-rust bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 md:p-10 shadow-lg text-white">
      <div className="flex flex-col items-center mb-6 text-center">
        <img
          src="/ironclad_founder_shield_logo.png"
          alt=""
          className="mb-4 h-20 w-auto drop-shadow-md"
          aria-hidden="true"
        />
        <h3 className="text-2xl md:text-3xl font-bold">Lock in Founding Partner Pricing</h3>
        <p className="mt-2 text-zinc-300 text-sm max-w-xl">
          Spots are limited per trade and county. Once your trade fills, founder pricing closes permanently.
        </p>
      </div>

      {/* Tier selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-zinc-300 mb-3">Choose your tier</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {FOUNDER_TIERS.map((tier) => {
            const active = tier.id === selectedTierId;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => selectTier(tier.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-lw-rust bg-zinc-900/80 shadow-md'
                    : 'border-zinc-700 bg-zinc-900/40 hover:border-lw-rust/60'
                }`}
              >
                <div className="font-bold text-white text-sm">{tier.name}</div>
                <div className="mt-1 text-xl font-bold text-lw-rust">${tier.renewalRate}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  locked forever · save ${tier.savingsMonthly}/mo
                </div>
                <div className="text-xs text-zinc-500 mt-1">{tier.spotsPerCounty} spots/county</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* One-time add-ons */}
      <div className="mb-6 border-t border-zinc-700 pt-6">
        <p className="text-sm font-semibold text-zinc-300 mb-1">Bundle one-time add-ons (optional)</p>
        <p className="text-xs text-zinc-500 mb-4">
          Add these to your $75 activation today. Monthly services can be added anytime from your dashboard.
        </p>

        <div className="space-y-2.5">
          {FOUNDER_ONETIME_ADDONS.map((addon) => {
            const isIncluded = addon.includedIn?.includes(selectedTier.baseTierId) ?? false;
            const price = getAddonPriceForTier(addon, selectedTier.baseTierId);
            const checked = checkedAddons.includes(addon.id);

            if (isIncluded) {
              return (
                <div
                  key={addon.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-900/30 px-4 py-3 opacity-70"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-300">{addon.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">Included</span>
                </div>
              );
            }

            return (
              <label
                key={addon.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                  checked
                    ? 'border-lw-rust bg-zinc-900/80'
                    : 'border-zinc-700 bg-zinc-900/40 hover:border-lw-rust/60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAddon(addon.id)}
                  className="mt-0.5 h-5 w-5 rounded border-zinc-600 bg-zinc-900 text-lw-rust focus:ring-lw-rust focus:ring-2 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-white">{addon.name}</span>
                    <span className="text-sm font-bold text-lw-rust whitespace-nowrap">${price}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{addon.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Running total */}
      <div className="mb-6 rounded-xl border border-lw-rust/40 bg-zinc-900/60 px-5 py-4">
        <div className="flex items-center justify-between text-sm text-zinc-400 mb-1">
          <span>Activation fee (one-time)</span>
          <span className="text-zinc-200">${ACTIVATION_FEE}</span>
        </div>
        {checkedAddons.map((id) => {
          const addon = ADDON_LIST.find((a) => a.id === id);
          if (!addon) return null;
          const price = getAddonPriceForTier(addon, selectedTier.baseTierId);
          return (
            <div key={id} className="flex items-center justify-between text-sm text-zinc-400 mb-1">
              <span className="truncate pr-4">{addon.name}</span>
              <span className="text-zinc-200">${price}</span>
            </div>
          );
        })}
        <div className="mt-2 pt-2 border-t border-zinc-700 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Due today</span>
          <span className="text-xl font-bold text-white">${todayTotal}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          then ${selectedTier.renewalRate}/mo forever · standard rate is ${selectedTier.standardRate}/mo
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={handleApply}
        size="lg"
        className="w-full bg-lw-rust hover:bg-lw-rust/90 text-white font-bold text-base py-6"
      >
        <Lock className="mr-2 h-4 w-4" />
        {buildButtonLabel()}
      </Button>

      <p className="mt-3 text-center text-xs text-zinc-500">
        Applications reviewed within 72 hours. Founding Partner pricing confirmed after admin approval.
      </p>
    </div>
  );
}
