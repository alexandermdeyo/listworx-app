/**
 * ListWorx Media Services catalog and pricing. This file is the ONLY source of
 * media prices: checkout recalculates every total here on the server and never
 * trusts a price or discount sent by the browser. Self-contained (no imports)
 * so the pricing rules can be unit tested directly.
 */

export type MediaKind = 'package' | 'service' | 'addon';

export type MediaItem = {
  code: string;
  name: string;
  kind: MediaKind;
  priceCents: number;
  /** Default on-site minutes per visit (admin can override in schedule settings). */
  minutes: number;
  /** Number of separate appointments this service needs. */
  visits: 1 | 2;
  /** Minutes an add-on adds to the visit. */
  addMinutes?: number;
  summary: string;
  includes: string[];
};

export const MEDIA_PACKAGES: MediaItem[] = [
  {
    code: 'contractor_essentials',
    name: 'Contractor Essentials',
    kind: 'package',
    priceCents: 59900,
    minutes: 90,
    visits: 1,
    summary: 'A clean set of professional photos for your website, profile, and social media.',
    includes: ['Up to 90 minutes on-site', 'One location', '15 professionally edited photographs', 'Team portraits, jobsite, equipment, or branding photographs'],
  },
  {
    code: 'contractor_growth_media',
    name: 'Contractor Growth Media',
    kind: 'package',
    priceCents: 149900,
    minutes: 180,
    visits: 1,
    summary: 'Photos plus a short promotional video and a vertical clip for social media.',
    includes: ['Up to 3 hours on-site', 'One location', '30 edited photographs', 'One 45 to 60 second promotional video', 'One vertical social clip'],
  },
  {
    code: 'contractor_authority_media',
    name: 'Contractor Authority Media',
    kind: 'package',
    priceCents: 299900,
    minutes: 300,
    visits: 1,
    summary: 'A full brand shoot: photos, a brand video, social clips, and a short owner interview.',
    includes: [
      'Up to 5 hours on-site',
      'One location',
      '50 edited photographs',
      'One 90-second brand video',
      'Three vertical social clips',
      'Short owner interview',
      'Drone footage where legally permitted and operationally feasible',
    ],
  },
];

export const MEDIA_SERVICES: MediaItem[] = [
  { code: 'jobsite_progress', name: 'Jobsite Progress Photography', kind: 'service', priceCents: 39900, minutes: 90, visits: 1, summary: '15 edited photos of a project in progress.', includes: ['15 edited photos', 'One location'] },
  { code: 'before_after', name: 'Before-and-After Photography', kind: 'service', priceCents: 74900, minutes: 90, visits: 2, summary: 'Two visits: one before the work starts and one after it is finished.', includes: ['Two separate visits', 'Before and after photos of the same project'] },
  { code: 'profile_video', name: 'Contractor Profile Video', kind: 'service', priceCents: 49900, minutes: 120, visits: 1, summary: 'A short video introducing you and your business for your ListWorx profile and website.', includes: ['One edited profile video', 'One location'] },
  { code: 'team_headshots', name: 'Team Headshots', kind: 'service', priceCents: 29900, minutes: 60, visits: 1, summary: 'Professional headshots for up to five people.', includes: ['Up to five people', 'Edited headshots'] },
];

export const MEDIA_ADDONS: MediaItem[] = [
  { code: 'drone_photo', name: 'Drone Photo Add-on', kind: 'addon', priceCents: 17500, minutes: 0, addMinutes: 30, visits: 1, summary: 'Aerial photos where legally permitted and operationally feasible.', includes: [] },
  { code: 'extra_15_photos', name: 'Additional 15 Edited Photos', kind: 'addon', priceCents: 17500, minutes: 0, addMinutes: 0, visits: 1, summary: '15 more edited photos from the same shoot.', includes: [] },
  { code: 'vertical_reel', name: 'Edited Vertical Social Reel', kind: 'addon', priceCents: 24900, minutes: 0, addMinutes: 30, visits: 1, summary: 'One edited vertical reel from the same shoot.', includes: [] },
  { code: 'extra_hour', name: 'Additional On-Site Hour', kind: 'addon', priceCents: 17500, minutes: 0, addMinutes: 60, visits: 1, summary: 'One more hour on-site.', includes: [] },
];

/** Add-ons that need an existing shoot can only be bought with one of these. */
export const QUALIFYING_FOR_ADDONS = [...MEDIA_PACKAGES, ...MEDIA_SERVICES].map((i) => i.code);

const ALL = [...MEDIA_PACKAGES, ...MEDIA_SERVICES, ...MEDIA_ADDONS];

export function getMediaItem(code: string): MediaItem | undefined {
  return ALL.find((i) => i.code === code);
}

/** Bookable main services (packages + à la carte services). */
export function getBookableService(code: string): MediaItem | undefined {
  const item = getMediaItem(code);
  return item && item.kind !== 'addon' ? item : undefined;
}

export type MembershipTier = 'network' | 'growth' | 'business_pro' | null;

/** Media discount for a VERIFIED current membership. Discounts do not stack. */
export function mediaDiscountPercent(tier: MembershipTier): 0 | 5 | 10 {
  if (tier === 'business_pro') return 10;
  if (tier === 'growth') return 5;
  return 0;
}

export type QuoteLine = { code: string; name: string; retailCents: number; discountCents: number; finalCents: number };
export type Quote = {
  service: MediaItem;
  addons: MediaItem[];
  lines: QuoteLine[];
  retailCents: number;
  discountPercent: 0 | 5 | 10;
  discountCents: number;
  totalCents: number;
  visits: 1 | 2;
};

export class MediaQuoteError extends Error {}

/**
 * Builds a quote from codes only. Unknown codes, duplicate add-ons, and add-ons
 * without a qualifying service are rejected.
 */
export function buildMediaQuote(serviceCode: string, addonCodes: string[] | undefined, tier: MembershipTier): Quote {
  const service = getBookableService(String(serviceCode || ''));
  if (!service) throw new MediaQuoteError('Choose a media service.');
  const codes = Array.isArray(addonCodes) ? addonCodes.map(String) : [];
  if (new Set(codes).size !== codes.length) throw new MediaQuoteError('Each add-on can be added once.');
  const addons = codes.map((c) => {
    const a = getMediaItem(c);
    if (!a || a.kind !== 'addon') throw new MediaQuoteError('Unknown add-on.');
    return a;
  });
  if (addons.length && !QUALIFYING_FOR_ADDONS.includes(service.code)) {
    throw new MediaQuoteError('Add-ons require a qualifying photo or video service.');
  }
  const discountPercent = mediaDiscountPercent(tier);
  const lines: QuoteLine[] = [service, ...addons].map((item) => {
    const discountCents = Math.round((item.priceCents * discountPercent) / 100);
    return { code: item.code, name: item.name, retailCents: item.priceCents, discountCents, finalCents: item.priceCents - discountCents };
  });
  const retailCents = lines.reduce((s, l) => s + l.retailCents, 0);
  const discountCents = lines.reduce((s, l) => s + l.discountCents, 0);
  return { service, addons, lines, retailCents, discountPercent, discountCents, totalCents: retailCents - discountCents, visits: service.visits };
}

/** On-site minutes for one visit. Duration overrides come from admin schedule settings. */
export function visitMinutes(quote: Pick<Quote, 'service' | 'addons'>, overrides: Record<string, number> = {}, visit = 1): number {
  const base = Number(overrides[quote.service.code]) > 0 ? Number(overrides[quote.service.code]) : quote.service.minutes;
  // Add-on time applies to the first visit only.
  const extra = visit === 1 ? quote.addons.reduce((s, a) => s + (a.addMinutes || 0), 0) : 0;
  return base + extra;
}

export const formatUsd = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

// ── Order fulfillment status ────────────────────────────────────────────────
export type FulfillmentStatus =
  | 'awaiting_payment'
  | 'pending_confirmation'
  | 'reschedule_proposed'
  | 'confirmed'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'canceled';

/** Admin status moves allowed from each status. Unpaid orders can never be confirmed. */
export const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  awaiting_payment: ['canceled'],
  pending_confirmation: ['confirmed', 'reschedule_proposed', 'canceled'],
  reschedule_proposed: ['confirmed', 'reschedule_proposed', 'canceled'],
  confirmed: ['in_progress', 'reschedule_proposed', 'delivered', 'completed', 'canceled'],
  in_progress: ['delivered', 'completed', 'canceled'],
  delivered: ['completed', 'in_progress'],
  completed: [],
  canceled: [],
};

export function canTransition(from: string, to: string, paymentStatus: string): boolean {
  if (to !== 'canceled' && paymentStatus !== 'paid' && paymentStatus !== 'partially_refunded') return false;
  const allowed = FULFILLMENT_TRANSITIONS[from as FulfillmentStatus];
  return Boolean(allowed && allowed.includes(to as FulfillmentStatus));
}

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  pending_confirmation: 'Appointment requested, pending confirmation',
  reschedule_proposed: 'New time proposed',
  confirmed: 'Appointment confirmed',
  in_progress: 'In progress',
  delivered: 'Delivered',
  completed: 'Completed',
  canceled: 'Canceled',
};
