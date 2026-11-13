/**
 * Contractor referral notifications — sent once per referral, never duplicated.
 * Framework-free so it can be tested directly.
 *
 * Owner rules (2026-11-12):
 *   - A referral exists once the contractor's information is delivered to the
 *     requestor; the notification never decides whether a referral counts.
 *   - One notification per referral: the referral row is "claimed"
 *     (email_sent false -> true) before sending, so a retry or a second caller
 *     cannot send it again. A failed send releases the claim for a later retry.
 *   - The message contains no job, requestor, trade or location details.
 */

export type ReferredContractor = {
  referralId: string;
  email: string | null;
  ownerName: string | null;
  companyName: string | null;
};

export type ReferralNotifyDeps = {
  /** Atomically mark the referral as emailed if it was not already; true when this caller won the claim. */
  claim(referralId: string): Promise<boolean>;
  /** Undo a claim after a failed send so the email can be retried. */
  release(referralId: string): Promise<void>;
  /** Send the email; resolves true only when the provider accepted it. */
  send(payload: Record<string, unknown>): Promise<boolean>;
};

export type ReferralNotifyResult = { referralId: string; outcome: 'sent' | 'already_sent' | 'no_email' | 'failed' };

export function referralEmailPayload(c: ReferredContractor) {
  // Deliberately nothing about the job or the requestor.
  return {
    type: 'referral_notification',
    to: c.email,
    contractorName: c.ownerName || 'there',
    companyName: c.companyName || 'your business',
  };
}

export async function notifyReferredContractors(
  contractors: ReferredContractor[],
  deps: ReferralNotifyDeps
): Promise<ReferralNotifyResult[]> {
  const results = await Promise.allSettled(
    contractors.map(async (c): Promise<ReferralNotifyResult> => {
      if (!c.email) return { referralId: c.referralId, outcome: 'no_email' };
      if (!(await deps.claim(c.referralId))) return { referralId: c.referralId, outcome: 'already_sent' };
      let ok = false;
      try {
        ok = await deps.send(referralEmailPayload(c));
      } catch {
        ok = false;
      }
      if (!ok) {
        await deps.release(c.referralId).catch(() => undefined);
        return { referralId: c.referralId, outcome: 'failed' };
      }
      return { referralId: c.referralId, outcome: 'sent' };
    })
  );
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { referralId: contractors[i].referralId, outcome: 'failed' as const }
  );
}

/**
 * Only contractors whose referral was actually recorded are delivered to the
 * requestor, so every contractor a requestor sees is counted exactly once.
 */
export function deliverableContractors<T extends { id: string }>(
  matched: T[],
  recorded: { id: string; contractor_id: string }[] | null | undefined
): Array<T & { referralId: string }> {
  const byContractor = new Map((recorded || []).map((r) => [r.contractor_id, r.id]));
  return matched
    .filter((c) => byContractor.has(c.id))
    .map((c) => ({ ...c, referralId: byContractor.get(c.id)! }));
}

/**
 * What a requestor may receive about a referred contractor: the public card
 * only. Profile rows also hold private document links, billing IDs and admin
 * fields, which must never leave the server.
 */
export const REQUESTOR_CARD_FIELDS = [
  'id',
  'company_name',
  'owner_name',
  'email',
  'phone',
  'website',
  'business_website',
  'profile_slug',
  'bio',
  'years_in_business',
  'ironclad_certified',
  'founder_status',
  'founding_partner',
  'founding_partner_badge',
  'logo_url',
] as const;
// Never: subscription tier/status, billing IDs, document links, license numbers,
// partner status, admin notes. (Owner rule 2026-11-12: requestors never see a
// contractor's subscription.)

export function requestorCard(profile: Record<string, unknown>, trade?: string | null) {
  const card: Record<string, unknown> = {};
  for (const key of REQUESTOR_CARD_FIELDS) card[key] = profile[key] ?? null;
  // The contractor's own website first, as on the public profile.
  card.website = (profile.business_website as string) || (profile.website as string) || null;
  card.trade = trade || null;
  return card;
}
