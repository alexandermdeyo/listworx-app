/**
 * Approved ListWorx 2.0 membership benefits (Nov 22 2026). One source for the
 * pricing cards, comparison table, billing page, and dashboard so they never
 * drift apart. Prices here are display only; Stripe prices are unchanged.
 * Self-contained (no imports) so access rules can be unit tested.
 */

export type MembershipTierId = 'network' | 'growth' | 'business_pro';

export type MembershipPlan = {
  id: MembershipTierId;
  name: string;
  priceLabel: string;
  tagline: string;
  highlights: string[];
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'network',
    name: 'Network',
    priceLabel: '$0',
    tagline: 'Join the network free. No credit card.',
    highlights: ['Contractor profile', 'Equal referral eligibility', 'IronClad Standards participation', 'Basic AI Toolkit', 'Basic educational resources'],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: '$199',
    tagline: 'Business resources and member pricing on media.',
    highlights: ['Everything in Network', 'Advanced business manuals and templates', 'Marketing templates and content resources', '5% off ListWorx Media Services'],
  },
  {
    id: 'business_pro',
    name: 'Business Pro',
    priceLabel: '$299',
    tagline: 'Done-for-you social posts and the full Flyer Builder.',
    highlights: ['Everything in Growth', '2 custom branded social posts per month', 'Full Flyer Builder', '10% off ListWorx Media Services'],
  },
];

export type ComparisonRow = { label: string; note?: string; values: [string, string, string] };

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Contractor profile', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Equal referral eligibility', note: 'Paid membership never buys referral priority, approval, or IronClad Certification.', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'IronClad Standards participation', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Basic AI Toolkit', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Basic educational resources', values: ['Yes', 'Yes', 'Yes'] },
  { label: 'Advanced business manuals and templates', values: ['No', 'Yes', 'Yes'] },
  { label: 'Marketing templates and content resources', values: ['No', 'Yes', 'Yes'] },
  {
    label: 'Custom branded social posts',
    note: 'Two finished static graphics or photo-based posts per calendar month, captions included, one reasonable revision each. No video, paid ads, or on-site photography. Unused posts do not roll over. You publish them.',
    values: ['No', 'No', '2 per month'],
  },
  { label: 'ListWorx Media Services (photo and video)', values: ['Retail pricing', '5% discount', '10% discount'] },
  { label: 'Full Flyer Builder', values: ['No', 'No', 'Yes'] },
  { label: 'Business Growth Consultations', values: ['Not available yet', 'Not available yet', 'Not available yet'] },
];

/** Paid resources (advanced manuals, templates, marketing resources). */
export const hasPaidResources = (tier: MembershipTierId | null) => tier === 'growth' || tier === 'business_pro';
export const hasFlyerBuilder = (tier: MembershipTierId | null) => tier === 'business_pro';
export const SOCIAL_POSTS_PER_MONTH = 2;
export const socialPostAllowance = (tier: MembershipTierId | null) => (tier === 'business_pro' ? SOCIAL_POSTS_PER_MONTH : 0);

/** Map a tiers.name value to a membership id. Legacy/unknown names map to null. */
export function tierIdFromName(name: string | null | undefined): MembershipTierId | null {
  const n = String(name || '').trim().toLowerCase();
  if (n === 'network') return 'network';
  if (n === 'growth') return 'growth';
  if (n === 'business pro') return 'business_pro';
  return null;
}

/**
 * Current membership from subscription rows. Paid tiers count only while the
 * row is active, has a Stripe subscription, and its period has not ended.
 * Expired, cancelled, past-due, and historical rows never grant paid access.
 */
export function currentMembership(
  rows: Array<{ status?: string | null; stripe_subscription_id?: string | null; current_period_end?: string | null; tier_name?: string | null }>,
  now: Date = new Date(),
): MembershipTierId | null {
  let best: MembershipTierId | null = null;
  const rank = { network: 1, growth: 2, business_pro: 3 } as const;
  for (const r of rows) {
    const tier = tierIdFromName(r.tier_name);
    if (!tier) continue;
    if (String(r.status || '').toLowerCase() !== 'active') continue;
    if (tier !== 'network') {
      if (!r.stripe_subscription_id) continue;
      if (r.current_period_end && Date.parse(r.current_period_end) < now.getTime()) continue;
    }
    if (!best || rank[tier] > rank[best]) best = tier;
  }
  return best;
}

/** First day of the calendar month (UTC date string) for social post allowances. */
export function periodMonth(now: Date = new Date(), timeZone = 'America/Chicago'): string {
  const ym = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).format(now);
  return `${ym.slice(0, 7)}-01`;
}
