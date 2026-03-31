import { SupabaseClient } from '@supabase/supabase-js';

const TIER_WEIGHTS: Record<string, number> = {
  'Elite Partner': 300,
  'elite': 300,
  'Preferred Partner': 200,
  'preferred': 200,
  'Basic Partner': 100,
  'basic': 100,
  'none': 50,
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
  score: number;
  matchReason: string;
}

function getTierWeight(tier: string | null): number {
  if (!tier) return TIER_WEIGHTS['none'];
  return TIER_WEIGHTS[tier] || TIER_WEIGHTS['none'];
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
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

  const { data: countyContractorRows } = await supabase
    .from('contractor_counties')
    .select('contractor_id')
    .eq('county_id', countyId);

  const countyContractorIds = Array.from(
    new Set((countyContractorRows || []).map((r: any) => r.contractor_id).filter(Boolean))
  );

  if (!countyContractorIds.length) return [];

  const { data: activeProfiles } = await supabase
    .from('contractor_profiles')
    .select('id, user_id, company_name, owner_name, email, phone, website, bio, tier, total_referrals_received')
    .in('id', countyContractorIds)
    .eq('partner_status', 'active')
    .eq('archived', false);

  if (!activeProfiles?.length) return [];

  const activeContractorIds = activeProfiles.map((c: any) => c.id);

  const { data: contractorCategories } = await supabase
    .from('contractor_categories')
    .select('contractor_id')
    .in('contractor_id', activeContractorIds)
    .in('category_id', categoryIds);

  const matchedIdSet = new Set(
    (contractorCategories || []).map((r: any) => r.contractor_id).filter(Boolean)
  );

  const eligibleContractors = activeProfiles.filter((c: any) => matchedIdSet.has(c.id));

  if (!eligibleContractors.length) return [];

  const today = new Date().toISOString().slice(0, 10);
  const rotationSeed = jobRequestId || today;

  const scored: MatchedContractor[] = eligibleContractors.map((c: any) => {
    const tierWeight = getTierWeight(c.tier);
    const referralPenalty = Math.min((c.total_referrals_received || 0) * 0.5, 50);
    const rotationJitter = seededRandom(`${rotationSeed}-${c.id}`) * 30;
    const score = tierWeight - referralPenalty + rotationJitter;

    const tierLabel = c.tier || 'basic';
    const matchReason = `tier:${tierLabel},weight:${tierWeight},refs:${c.total_referrals_received || 0}`;

    return {
      id: c.id,
      user_id: c.user_id,
      company_name: c.company_name,
      owner_name: c.owner_name,
      email: c.email,
      phone: c.phone,
      website: c.website,
      bio: c.bio,
      tier: c.tier,
      total_referrals_received: c.total_referrals_received || 0,
      score,
      matchReason,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_REFERRALS);
}

export function buildReferralRows(
  jobRequestId: string,
  contractors: MatchedContractor[]
) {
  return contractors.map((contractor, index) => ({
    job_request_id: jobRequestId,
    contractor_id: contractor.id,
    status: 'PENDING',
    slot_position: index + 1,
    tier_at_referral: contractor.tier || 'Basic',
    match_score: contractor.score,
    match_reason: contractor.matchReason,
    email_sent: false,
  }));
}

export async function incrementReferralCounts(
  supabase: SupabaseClient,
  contractorIds: string[]
) {
  for (const id of contractorIds) {
    const { error } = await supabase.rpc('increment_referral_count', { contractor_id_input: id });
    if (error) {
      await supabase
        .from('contractor_profiles')
        .update({ total_referrals_received: 1 })
        .eq('id', id);
    }
  }
}
