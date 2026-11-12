import type { SupabaseClient } from '@supabase/supabase-js';
import { applyComplianceGate, type ComplianceRow } from './compliance/rules.ts';

/**
 * Insurance/license compliance gate, evaluated at matching time for THIS job:
 * referral_eligibility() checks insurance plus any license required for the
 * job's county and requested trades (rules are per trade and place, with admin
 * review of unclear cases). Only removes candidates; never changes ranking.
 * Enforced only when admin_settings.compliance_holds_enforced = 'true';
 * otherwise would-be holds are logged (shadow mode).
 */
async function filterByCompliance<T extends { id: string }>(
  supabase: SupabaseClient,
  profiles: T[],
  job: { countyId: string; categoryIds: string[] }
): Promise<T[]> {
  if (!profiles.length) return profiles;
  const [{ data: setting }, { data: rows, error }] = await Promise.all([
    supabase.from('admin_settings').select('value').eq('key', 'compliance_holds_enforced').maybeSingle(),
    supabase.rpc('referral_eligibility', {
      p_contractor_ids: profiles.map((p) => p.id),
      p_county_id: job.countyId,
      p_category_ids: job.categoryIds,
    }),
  ]);
  const enforced = String(setting?.value || '').toLowerCase() === 'true';
  if (error) console.error('[matching] compliance lookup failed:', error);
  const { allowedIds, held } = applyComplianceGate(
    profiles.map((p) => p.id),
    error ? null : ((rows || []) as ComplianceRow[]),
    enforced
  );
  if (held.length) {
    console.log(enforced ? '[matching] compliance hold applied' : '[matching] compliance hold (shadow, not enforced)', held);
  }
  const allowed = new Set(allowedIds);
  return profiles.filter((p) => allowed.has(p.id));
}

const TIER_WEIGHTS: Record<string, number> = {
  'Elite Partner': 300,
  elite: 300,
  'Preferred Partner': 200,
  preferred: 200,
  'Basic Partner': 100,
  basic: 100,
  none: 50,
};

const MAX_REFERRALS = 3;

interface MatchedContractor {
  id: string;
  user_id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website: string | null;
  bio: string | null;
  tier: string | null;
  total_referrals_received: number;
  /** Contractor's "Email Notifications" setting; false = no optional referral emails. */
  notification_email: boolean;
  score: number;
  matchReason: string;
}

function getTierWeight(tier: string | null): number {
  if (!tier) return TIER_WEIGHTS.none;
  return TIER_WEIGHTS[tier] || TIER_WEIGHTS.none;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function pickString(row: any, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function pickNullableString(row: any, keys: string[]): string | null {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function pickNumber(row: any, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return fallback;
}

export async function findMatchedContractors(
  supabase: SupabaseClient,
  options: {
    countyId: string;
    categoryIds: string[];
    jobRequestId?: string;
  }
): Promise<MatchedContractor[]> {
  const { countyId, categoryIds, jobRequestId } = options;

  if (!categoryIds.length) return [];

  const { data: countyContractorRows, error: countyError } = await supabase
    .from('contractor_counties')
    .select('contractor_id')
    .eq('county_id', countyId);

  if (countyError) {
    console.error('[matching] contractor_counties lookup failed:', countyError);
    return [];
  }

  const countyContractorIds = Array.from(
    new Set((countyContractorRows || []).map((r: any) => r.contractor_id).filter(Boolean))
  );

  if (!countyContractorIds.length) {
    console.log('[matching] no contractor_counties rows for county:', countyId);
    return [];
  }

  const { data: contractorCategories, error: categoriesError } = await supabase
    .from('contractor_categories')
    .select('contractor_id, category_id')
    .in('contractor_id', countyContractorIds)
    .in('category_id', categoryIds);

  if (categoriesError) {
    console.error('[matching] contractor_categories lookup failed:', categoriesError);
    return [];
  }

  const matchedIdSet = new Set(
    (contractorCategories || []).map((r: any) => r.contractor_id).filter(Boolean)
  );

  if (!matchedIdSet.size) {
    console.log('[matching] no contractor_categories matches for county/categories', {
      countyId,
      categoryIds,
    });
    return [];
  }

  const eligibleIds = countyContractorIds.filter((id) => matchedIdSet.has(id));

  const { data: activeProfiles, error: profilesError } = await supabase
    .from('contractor_profiles')
    .select('*')
    .in('id', eligibleIds)
    .eq('partner_status', 'active')
    .eq('archived', false);

  if (profilesError) {
    console.error('[matching] contractor_profiles lookup failed:', profilesError);
    return [];
  }

  if (!activeProfiles?.length) {
    console.log('[matching] eligible contractors found, but no active profiles returned', {
      countyId,
      categoryIds,
      eligibleIds,
    });
    return [];
  }

  // Compliance holds remove candidates before scoring; ranking below is unchanged.
  const compliantProfiles = await filterByCompliance(supabase, activeProfiles as any[], { countyId, categoryIds });
  if (!compliantProfiles.length) {
    console.log('[matching] all active candidates are on compliance hold', { countyId, categoryIds });
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const rotationSeed = jobRequestId || today;

  const scored: MatchedContractor[] = compliantProfiles.map((row: any) => {
    // subscription_tier is the only tier column that exists on contractor_profiles.
    // A contractor with no subscription_tier set (null) is treated as Basic, not excluded.
    const tier = pickNullableString(row, ['subscription_tier']) || 'basic';

    const totalReferralsReceived = pickNumber(
      row,
      ['total_referrals_received', 'referral_count', 'total_referrals'],
      0
    );

    const tierWeight = getTierWeight(tier);
    const referralPenalty = Math.min(totalReferralsReceived * 0.5, 50);
    const rotationJitter = seededRandom(`${rotationSeed}-${row.id}`) * 30;
    const score = tierWeight - referralPenalty + rotationJitter;

    return {
      id: row.id,
      user_id: row.user_id,
      company_name: pickString(row, ['company_name'], 'Contractor'),
      owner_name: pickString(row, ['owner_name', 'contact_name'], ''),
      email: pickString(row, ['email'], ''),
      phone: pickString(row, ['phone'], ''),
      website: pickNullableString(row, ['website', 'website_url']),
      bio: pickNullableString(row, ['bio', 'company_bio', 'description']),
      tier,
      total_referrals_received: totalReferralsReceived,
      notification_email: row.notification_email !== false,
      score,
      matchReason: `tier:${tier},weight:${tierWeight},refs:${totalReferralsReceived}`,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_REFERRALS);
}

export function buildReferralRows(jobRequestId: string, contractors: MatchedContractor[]) {
  return contractors.map((contractor) => ({
    job_request_id: jobRequestId,
    contractor_id: contractor.id,
    status: 'PENDING',
    notes: null,
  }));
}

export function buildJobAssignmentRows(
  jobRequestId: string,
  contractors: MatchedContractor[],
  referrals: { id: string; contractor_id: string }[]
) {
  return contractors.map((contractor) => {
    const matchingReferral = referrals.find((r) => r.contractor_id === contractor.id);

    return {
      job_request_id: jobRequestId,
      contractor_id: contractor.id,
      referral_id: matchingReferral?.id || null,
      status: 'ASSIGNED',
    };
  });
}

export async function incrementReferralCounts(
  supabase: SupabaseClient,
  contractorIds: string[]
) {
  for (const id of contractorIds) {
    const { error } = await supabase.rpc('increment_referral_count', {
      contractor_id_input: id,
    });

    if (error) {
      console.error('[matching] increment_referral_count rpc failed:', error);

      const { data: currentRow } = await supabase
        .from('contractor_profiles')
        .select('total_referrals_received')
        .eq('id', id)
        .maybeSingle();

      const nextValue = (currentRow?.total_referrals_received || 0) + 1;

      const { error: fallbackError } = await supabase
        .from('contractor_profiles')
        .update({
          total_referrals_received: nextValue,
        })
        .eq('id', id);

      if (fallbackError) {
        console.error('[matching] fallback referral count update failed:', fallbackError);
      }
    }
  }
}