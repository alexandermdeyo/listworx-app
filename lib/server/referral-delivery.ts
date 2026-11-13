/**
 * Referral delivery: record the referrals, then notify — shared by the public
 * request form and the admin "release held request" action so both follow the
 * same rules (owner, 2026-11-12):
 *   - a referral counts only when the contractor's information is delivered;
 *   - one referral per contractor per request (database-enforced);
 *   - one notification per referral; email failures never change the count;
 *   - requestors get public card fields only, never subscription or billing data.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildReferralRows,
  buildJobAssignmentRows,
  incrementReferralCounts,
} from '@/lib/contractor-matching';
import {
  deliverableContractors,
  notifyReferredContractors,
  requestorCard,
  REQUESTOR_CARD_FIELDS,
} from '@/lib/server/referral-notify';

type Matched = { id: string; company_name: string; owner_name: string; email: string; phone: string; website: string | null; bio: string | null; tier?: string | null };

/** Insert referral rows; only contractors whose row was saved are delivered. */
export async function recordReferrals<T extends Matched>(supabase: SupabaseClient, jobRequestId: string, matched: T[]) {
  if (matched.length === 0) return { delivered: [] as Array<T & { referralId: string }>, failed: false };
  const { data, error } = await supabase
    .from('referrals')
    .insert(buildReferralRows(jobRequestId, matched as any))
    .select('id, contractor_id');
  if (error) console.error('[referrals] insert failed — no contractors delivered:', error);
  const delivered = deliverableContractors(matched, error ? [] : data);
  if (delivered.length > 0) {
    const inserted = delivered.map((c) => ({ id: c.referralId, contractor_id: c.id }));
    const { error: assignmentError } = await supabase
      .from('job_assignments')
      .insert(buildJobAssignmentRows(jobRequestId, delivered as any, inserted));
    if (assignmentError) console.error('[referrals] job assignment insert failed:', assignmentError);
    await incrementReferralCounts(supabase as any, delivered.map((c) => c.id));
  }
  return { delivered, failed: Boolean(error) };
}

/** Public cards for the requestor: whitelisted profile fields + the requested trade(s) each covers. */
export async function buildRequestorCards(
  supabase: SupabaseClient,
  delivered: Matched[],
  categoryIds: string[],
  categoryNames: string[]
) {
  if (delivered.length === 0) return [];
  const ids = delivered.map((c) => c.id);
  const [{ data: cardRows, error: cardError }, { data: tradeRows }] = await Promise.all([
    supabase.from('contractor_profiles').select(REQUESTOR_CARD_FIELDS.join(', ')).in('id', ids),
    supabase.from('contractor_categories').select('contractor_id, category_id, categories(name)').in('contractor_id', ids).in('category_id', categoryIds),
  ]);
  if (cardError) console.error('[referrals] card profile lookup failed:', cardError);
  const byId: Record<string, Record<string, unknown>> = {};
  ((cardRows || []) as unknown as Record<string, unknown>[]).forEach((row) => { byId[String(row.id)] = row; });
  const trades: Record<string, string> = {};
  (tradeRows || []).forEach((row: any) => {
    const name = row.categories?.name;
    if (name) trades[row.contractor_id] = trades[row.contractor_id] ? `${trades[row.contractor_id]}, ${name}` : name;
  });
  return delivered.map((c) =>
    requestorCard(
      byId[c.id] || { id: c.id, company_name: c.company_name, owner_name: c.owner_name, email: c.email, phone: c.phone, website: c.website, bio: c.bio },
      trades[c.id] || categoryNames.join(', ')
    )
  );
}

/* ─────────────────────────────────────────────────────────────
   EMAIL HELPERS — called only AFTER all DB writes complete.
   These do NOT modify any referral/matching logic.
   ───────────────────────────────────────────────────────────── */

/** Referral notification for each delivered contractor — once per referral, no job details. */
export async function sendContractorReferralEmails(
  supabase: SupabaseClient,
  delivered: Array<{ id: string; referralId: string; company_name: string; owner_name: string; email: string }>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const results = await notifyReferredContractors(
    delivered.map((c) => ({
      referralId: c.referralId,
      email: c.email,
      ownerName: c.owner_name,
      companyName: c.company_name,
    })),
    {
      async claim(referralId) {
        const { data, error } = await supabase
          .from('referrals')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', referralId)
          .eq('email_sent', false)
          .select('id');
        if (error) {
          console.error('[job-request] referral email claim failed:', error);
          return false;
        }
        return (data || []).length === 1;
      },
      async release(referralId) {
        await supabase.from('referrals').update({ email_sent: false, email_sent_at: null }).eq('id', referralId);
      },
      async send(payload) {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          console.error('[job-request] contractor referral email failed:', await response.text());
        }
        return response.ok;
      },
    }
  );

  results
    .filter((r) => r.outcome === 'failed')
    .forEach((r) => console.error(`[job-request] referral email not sent for referral ${r.referralId}`));
  return results;
}

export async function sendRequestorMatchEmail(
  supabase: SupabaseClient,
  matchedContractors: Array<{
    id: string;
    company_name: string;
    owner_name: string;
    email: string;
    phone: string;
    website: string | null;
    bio: string | null;
  }>,
  jobData: {
    requesterName: string;
    requesterEmail: string;
    propertyAddress: string;
    categoryNames: string[];
    jobRequestId: string;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

  // Fetch extra profile data (logo_url, profile_slug, specialties) for contractor cards
  const contractorIds = matchedContractors.map((c) => c.id);

  const [{ data: profileExtras }, { data: categoryRows }] = await Promise.all([
    supabase
      .from('contractor_profiles')
      .select('id, logo_url, profile_slug')
      .in('id', contractorIds),
    supabase
      .from('contractor_categories')
      .select('contractor_id, categories(name)')
      .in('contractor_id', contractorIds),
  ]);

  const logoMap: Record<string, string | null> = {};
  const slugMap: Record<string, string | null> = {};
  (profileExtras || []).forEach((p: any) => {
    logoMap[p.id] = p.logo_url || null;
    slugMap[p.id] = p.profile_slug || null;
  });

  const specialtyMap: Record<string, string[]> = {};
  (categoryRows || []).forEach((row: any) => {
    const cId = row.contractor_id;
    const name = row.categories?.name;
    if (cId && name) {
      if (!specialtyMap[cId]) specialtyMap[cId] = [];
      specialtyMap[cId].push(name);
    }
  });

  const contractorCards = matchedContractors.map((c) => ({
    name: c.owner_name,
    company: c.company_name,
    phone: c.phone,
    email: c.email,
    website: c.website || undefined,
    bio: c.bio || undefined,
    logoUrl: logoMap[c.id] || null,
    profileUrl: slugMap[c.id]
      ? `${BASE_URL}/contractors/${slugMap[c.id]}`
      : `${BASE_URL}/contractors/${c.id}`,
    specialties: specialtyMap[c.id] || [],
  }));

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'contractor_match',
        to: jobData.requesterEmail,
        realtorName: jobData.requesterName,
        propertyAddress: jobData.propertyAddress,
        services: jobData.categoryNames,
        contractors: contractorCards,
        jobRequestId: jobData.jobRequestId,
        matchedContractors: contractorCards.length,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[job-request] requestor match email failed:', text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[job-request] requestor match email error:', err);
    return false;
  }
}

