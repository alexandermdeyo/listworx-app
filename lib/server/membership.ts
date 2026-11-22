import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { currentMembership, type MembershipTierId } from '@/lib/membership/benefits';

export type VerifiedMembership = {
  userId: string;
  contractorId: string | null;
  isRealtor: boolean;
  tier: MembershipTierId | null;
};

/**
 * The signed-in user's CURRENT membership, read server-side from the
 * subscriptions table. Never trust a tier sent by the browser.
 */
export async function getVerifiedMembership(userId: string): Promise<VerifiedMembership> {
  const db = createSupabaseAdminClient();
  const [{ data: contractor }, { data: realtor }] = await Promise.all([
    db.from('contractor_profiles').select('id').eq('user_id', userId).maybeSingle(),
    db.from('realtor_profiles').select('id').eq('user_id', userId).maybeSingle(),
  ]);
  let tier: MembershipTierId | null = null;
  if (contractor?.id) {
    const { data: subs } = await db
      .from('subscriptions')
      .select('status, stripe_subscription_id, current_period_end, tiers(name)')
      .eq('contractor_id', contractor.id);
    tier = currentMembership(
      (subs || []).map((s: any) => ({
        status: s.status,
        stripe_subscription_id: s.stripe_subscription_id,
        current_period_end: s.current_period_end,
        tier_name: Array.isArray(s.tiers) ? s.tiers[0]?.name : s.tiers?.name,
      })),
    );
  }
  return { userId, contractorId: contractor?.id || null, isRealtor: Boolean(realtor?.id), tier };
}
