export type StandardTierId = 'basic' | 'preferred' | 'elite';
export type AddOnType = 'onetime' | 'monthly';

export type StandardTier = {
  id: StandardTierId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthly: number;
  stripeMonthlyEnvVar: string;
  stripeAnnualEnvVar: string;
  badge: string | null;
  territoryLock: boolean;
  rotationPriority: 'standard' | 'priority' | 'top';
  highlighted: boolean;
  description: string;
  included: string[];
  notIncluded: string[];
};

export type FounderTier = {
  id: 'basic_founder' | 'preferred_founder' | 'elite_founder';
  baseTierId: StandardTierId;
  name: string;
  firstYear: string;
  renewalRate: number;
  annualRenewalRate: number;
  standardRate: number;
  savingsMonthly: number;
  savingsAnnual: number;
  spotsPerCounty: number;
  stripeRenewalEnvVar: string;
  included: string[];
};

export type AddOn = {
  id:
    | 'ironclad_badge_kit'
    | 'decal_package_founder'
    | 'decal_package_standard'
    | 'google_business_optimization'
    | 'contractor_profile_video'
    | 'recruiting_templates'
    | 'profile_boost'
    | 'performance_report'
    | 'social_content_pack'
    | 'reputation_management'
    | 'ai_marketing_toolkit'
    | 'featured_spotlight'
    | 'flyer_builder';
  name: string;
  description: string;
  type: AddOnType;
  price: number;
  preferredPrice?: number;
  elitePrice?: number;
  includedIn?: StandardTierId[];
  partialIncludedIn?: StandardTierId[];
  partialNote?: string;
  quarterlyIncludedIn?: StandardTierId[];
  founderOnly?: boolean;
  founderPrice?: number | null;
  stripeEnvVar?: string;
  stripeMonthlyEnvVar?: string;
  stripeAnnualEnvVar?: string;
  preferredStripeMonthlyEnvVar?: string;
  eliteStripeEnvVar?: string;
  eliteStripeMonthlyEnvVar?: string;
  highlight: boolean;
};

export const STANDARD_TIERS: StandardTier[] = [
  {
    id: 'basic',
    name: 'Network Member — Standard',
    monthlyPrice: 249,
    annualPrice: 2490,
    annualMonthly: 208,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_BASIC_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_BASIC_ANNUAL',
    badge: null,
    territoryLock: false,
    rotationPriority: 'standard',
    highlighted: false,
    description: 'Get into the network and start receiving referrals in your trade and county.',
    included: [
      'IronClad Verified status',
      'Profile on the ListWorx platform',
      'Listed in referral rotation — standard priority',
      'Contractor dashboard access',
      'Email notifications when you’re matched',
      'Verified reviews system',
      'Availability and service-area controls',
    ],
    notIncluded: [
      'Profile Boost',
      'Social Media Content Pack',
      'Monthly Performance Report',
      'Google Business Optimization',
      'Territory lock',
    ],
  },
  {
    id: 'preferred',
    name: 'Network Partner — Standard',
    monthlyPrice: 429,
    annualPrice: 4290,
    annualMonthly: 358,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_PREFERRED_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_PREFERRED_ANNUAL',
    badge: null,
    territoryLock: false,
    rotationPriority: 'priority',
    highlighted: true,
    description: 'Priority positioning plus the tools that make your profile worth clicking.',
    included: [
      'Everything in Network Member, plus:',
      'Priority placement — above all Network Members',
      'Enhanced profile with additional photos and expanded bio',
      'IronClad Digital Badge Kit included (vehicle, digital, print)',
      'AI Marketing Toolkit — social posts, follow-up emails, job templates',
      'SMS + email notifications for every match',
      'Monthly performance report (referrals received, match rate)',
      'Quarterly profile boost',
    ],
    notIncluded: [
      'Additional Profile Boosts beyond quarterly',
      'Social Media Content Pack',
      'Territory lock',
    ],
  },
  {
    id: 'elite',
    name: 'Network Elite — Standard',
    monthlyPrice: 729,
    annualPrice: 7290,
    annualMonthly: 608,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_ELITE_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_ELITE_ANNUAL',
    badge: 'Elite',
    territoryLock: true,
    rotationPriority: 'top',
    highlighted: false,
    description: 'Own your territory. No other Elite contractor of your trade in your county.',
    included: [
      'Everything in Network Partner, plus:',
      'Top of rotation — always above Partner and Member',
      'Territory lock — maximum 2 Elite per trade per county',
      'Monthly profile boost (not quarterly)',
      '2 social media posts per month featuring your work',
      'Annual featured contractor spotlight',
    ],
    notIncluded: [],
  },
];

export const FOUNDER_TIERS: FounderTier[] = [
  {
    id: 'basic_founder',
    baseTierId: 'basic',
    name: 'Network Member — Founding',
    firstYear: 'Included',
    renewalRate: 199,
    annualRenewalRate: 1990,
    standardRate: 249,
    savingsMonthly: 50,
    savingsAnnual: 600,
    spotsPerCounty: 10,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL',
    included: [
      'IronClad Verified status',
      'Profile on the ListWorx platform',
      'Listed in referral rotation — standard priority',
      'Contractor dashboard access',
      'Email notifications when you’re matched',
      'Verified reviews system',
      'Availability and service-area controls',
      'Founding Partner badge — permanent',
      'Territory reservation',
      'Rate locked for life',
    ],
  },
  {
    id: 'preferred_founder',
    baseTierId: 'preferred',
    name: 'Network Partner — Founding',
    firstYear: 'Included',
    renewalRate: 349,
    annualRenewalRate: 3490,
    standardRate: 429,
    savingsMonthly: 80,
    savingsAnnual: 960,
    spotsPerCounty: 5,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL',
    included: [
      'Everything in Network Member, plus:',
      'Priority placement — above all Network Members',
      'Enhanced profile with additional photos and expanded bio',
      'IronClad Digital Badge Kit included (vehicle, digital, print)',
      'AI Marketing Toolkit — social posts, follow-up emails, job templates',
      'SMS + email notifications for every match',
      'Monthly performance report (referrals received, match rate)',
      'Quarterly profile boost',
      'Founding Partner badge — permanent',
      'Territory reservation',
      'Rate locked for life',
    ],
  },
  {
    id: 'elite_founder',
    baseTierId: 'elite',
    name: 'Network Elite — Founding',
    firstYear: 'Included',
    renewalRate: 599,
    annualRenewalRate: 5990,
    standardRate: 729,
    savingsMonthly: 130,
    savingsAnnual: 1560,
    spotsPerCounty: 2,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL',
    included: [
      'Everything in Network Partner, plus:',
      'Top of rotation — always above Partner and Member',
      'Territory lock — maximum 2 Elite per trade per county',
      'Monthly profile boost (not quarterly)',
      '2 social media posts per month featuring your work',
      'Annual featured contractor spotlight',
      'Founding Partner badge — permanent',
      'Territory reservation — highest priority',
      'Rate locked for life',
    ],
  },
];

export const ADDON_LIST: AddOn[] = [
  {
    id: 'ironclad_badge_kit',
    name: 'IronClad Digital Badge Kit',
    description: 'IronClad badge PNG files, email signature banner, Facebook cover template, and as-seen-on-ListWorx graphics. Use on your own social media and marketing.',
    type: 'onetime',
    price: 29,
    includedIn: ['preferred', 'elite'],
    founderPrice: null,
    stripeEnvVar: 'STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME',
    highlight: false,
  },
  {
    id: 'decal_package_founder',
    name: 'IronClad Decal Package — Founder',
    description: 'Vehicle decal, window cling, and yard sign with IronClad badge. Founder pricing.',
    type: 'onetime',
    price: 49,
    includedIn: [],
    founderOnly: true,
    stripeEnvVar: 'STRIPE_ADDON_DECAL_PACKAGE_FOUNDER',
    highlight: false,
  },
  {
    id: 'decal_package_standard',
    name: 'IronClad Decal Package',
    description: 'Vehicle decal, window cling, and yard sign with IronClad badge.',
    type: 'onetime',
    price: 99,
    includedIn: [],
    founderOnly: false,
    stripeEnvVar: 'STRIPE_ADDON_DECAL_PACKAGE_STANDARD',
    highlight: false,
  },
  {
    id: 'google_business_optimization',
    name: 'Google Business Profile Optimization',
    description: 'We fully build out your Google Business Profile — every field, photos, services, and a proper description. Most contractors pay $149 for this separately.',
    type: 'onetime',
    price: 149,
    includedIn: ['elite'],
    founderPrice: null,
    stripeEnvVar: 'STRIPE_ADDON_GOOGLE_BUSINESS_ONETIME',
    highlight: false,
  },
  {
    id: 'contractor_profile_video',
    name: 'Contractor Profile Video',
    description: '60-90 second professional video for your ListWorx profile and social media. Produced by the ListWorx team.',
    type: 'onetime',
    price: 299,
    elitePrice: 249,
    includedIn: [],
    stripeEnvVar: 'STRIPE_ADDON_PROFILE_VIDEO_ONETIME',
    eliteStripeEnvVar: 'STRIPE_ADDON_PROFILE_VIDEO_ELITE_ONETIME',
    highlight: true,
  },
  {
    id: 'recruiting_templates',
    name: 'Recruiting & Hiring Templates',
    description: 'Job posting templates, interview guides, and onboarding checklists for contractors ready to hire their first employee.',
    type: 'onetime',
    price: 49,
    includedIn: ['elite'],
    stripeEnvVar: 'STRIPE_ADDON_RECRUITING_TEMPLATES',
    highlight: false,
  },
  {
    id: 'profile_boost',
    name: 'Profile Boost',
    description: 'Your profile moves to the top of the referral rotation for your trade and county for the entire month.',
    type: 'monthly',
    price: 79,
    includedIn: ['elite'],
    quarterlyIncludedIn: ['preferred'],
    stripeMonthlyEnvVar: 'STRIPE_ADDON_PROFILE_BOOST_MONTHLY',
    highlight: true,
  },
  {
    id: 'performance_report',
    name: 'Monthly Performance Report',
    description: 'Branded PDF delivered every month showing your referral stats, response rate, IronClad score, and county ranking.',
    type: 'monthly',
    price: 29,
    includedIn: ['preferred', 'elite'],
    stripeMonthlyEnvVar: 'STRIPE_ADDON_PERFORMANCE_REPORT_MONTHLY',
    highlight: false,
  },
  {
    id: 'social_content_pack',
    name: 'Social Media Content Pack',
    description: 'Four branded, ready-to-post social media graphics per month. Your logo, your trade, your jobs.',
    type: 'monthly',
    price: 149,
    elitePrice: 119,
    partialIncludedIn: ['elite'],
    partialNote: '2 posts included with Elite, add more at $79/mo',
    stripeMonthlyEnvVar: 'STRIPE_ADDON_SOCIAL_CONTENT_MONTHLY',
    eliteStripeMonthlyEnvVar: 'STRIPE_ADDON_SOCIAL_CONTENT_ELITE_MONTHLY',
    highlight: true,
  },
  {
    id: 'reputation_management',
    name: 'Reputation Management',
    description: 'We monitor your Google reviews, respond to negative reviews on your behalf, and send follow-up templates to customers asking for reviews.',
    type: 'monthly',
    price: 149,
    elitePrice: 99,
    includedIn: [],
    stripeMonthlyEnvVar: 'STRIPE_ADDON_REPUTATION_MGMT_MONTHLY',
    eliteStripeMonthlyEnvVar: 'STRIPE_ADDON_REPUTATION_MGMT_ELITE_MONTHLY',
    highlight: false,
  },
  {
    id: 'ai_marketing_toolkit',
    name: 'AI Marketing Toolkit',
    description: 'Generate social posts, estimate follow-up emails, and job description templates using AI — built specifically for contractors.',
    type: 'monthly',
    price: 79,
    // Included at no charge with Network Partner and Network Elite; Network
    // Member can add it for $79/mo.
    includedIn: ['preferred', 'elite'],
    stripeMonthlyEnvVar: 'STRIPE_ADDON_AI_TOOLKIT_BASIC_MONTHLY',
    highlight: false,
  },
  {
    id: 'featured_spotlight',
    name: 'Featured Partner Spotlight',
    description: 'Monthly content marketing program. Contractor of the Week on the ListWorx homepage, featured section in the monthly newsletter, and at least one dedicated social post per month using your photos and project media.',
    type: 'monthly',
    price: 249,
    includedIn: [],
    stripeEnvVar: 'STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY',
    highlight: true,
  },
  {
    id: 'flyer_builder',
    name: 'Marketing Flyer Builder',
    description: 'Template-based marketing document creator. Choose templates, add your photos, change text, upload logo, download as PDF. ListWorx and IronClad badges included on every template.',
    type: 'monthly',
    price: 29,
    includedIn: ['preferred', 'elite'],
    stripeEnvVar: 'STRIPE_ADDON_FLYER_BUILDER_BASIC_MONTHLY',
    highlight: false,
  },
];

export function getTierById(id: string) {
  return STANDARD_TIERS.find((t) => t.id === id) ?? null;
}

export function getTierByName(name?: string | null) {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  return STANDARD_TIERS.find((t) => t.name.toLowerCase() === normalized || t.id === normalized) ?? null;
}

export function getFounderTierByBaseId(baseTierId: string) {
  return FOUNDER_TIERS.find((t) => t.baseTierId === baseTierId) ?? null;
}

export function getAddonById(id: string) {
  return ADDON_LIST.find((a) => a.id === id) ?? null;
}

export function getAddonsForTier(tierId: string) {
  return ADDON_LIST.filter((a) => !a.includedIn?.includes(tierId as StandardTierId));
}

export function getIncludedAddons(tierId: string) {
  return ADDON_LIST.filter((a) => a.includedIn?.includes(tierId as StandardTierId));
}

export function getAddonPriceForTier(addOn: AddOn, tierId?: string | null) {
  if (tierId === 'elite' && addOn.elitePrice) return addOn.elitePrice;
  if (tierId === 'preferred' && addOn.preferredPrice) return addOn.preferredPrice;
  return addOn.price;
}

export function getAddonEnvVarForTier(addOn: AddOn, tierId?: string | null, billingPeriod = 'monthly') {
  if (addOn.type === 'onetime') {
    if (tierId === 'elite' && addOn.eliteStripeEnvVar) return addOn.eliteStripeEnvVar;
    return addOn.stripeEnvVar ?? null;
  }

  if (billingPeriod === 'annual' && addOn.stripeAnnualEnvVar) return addOn.stripeAnnualEnvVar;
  if (tierId === 'elite' && addOn.eliteStripeMonthlyEnvVar) return addOn.eliteStripeMonthlyEnvVar;
  if (tierId === 'preferred' && addOn.preferredStripeMonthlyEnvVar) return addOn.preferredStripeMonthlyEnvVar;
  return addOn.stripeMonthlyEnvVar ?? null;
}

/**
 * Resolve a contractor's effective base tier from the `subscription_tier` /
 * `founder_tier` columns on `contractor_profiles`. Founder tiers map back to
 * their base ('preferred_founder' -> 'preferred'). Returns null when nothing
 * is set so callers can decide how to treat an unknown tier.
 */
export function resolveBaseTierId(
  profile: { subscription_tier?: string | null; founder_tier?: string | null } | null | undefined,
): StandardTierId | null {
  if (!profile) return null;
  const raw = String(profile.founder_tier || profile.subscription_tier || '').toLowerCase();
  if (!raw) return null;
  if (raw.includes('elite')) return 'elite';
  if (raw.includes('preferred') || raw.includes('partner')) return 'preferred';
  if (raw.includes('basic') || raw.includes('member')) return 'basic';
  return null;
}

/** Base tiers that include the AI Marketing Toolkit at no extra charge. */
export const AI_TOOLKIT_TIERS: StandardTierId[] = ['preferred', 'elite'];

/**
 * Shown alongside every tier's feature list. The network's benefits are still
 * expanding, and everything added lands in existing plans at no extra cost —
 * this frames that as upside, not fine print. Same copy for Founding and
 * Standard tiers. No specific partner/supplier names.
 */
export const TIER_GROWTH_NOTE =
  "Your membership keeps growing. We're adding direct supplier connections, training, and business tools you'll reach right from your dashboard — each one included in your plan as it launches, at no extra cost. What you get today is the floor, not the ceiling.";

/**
 * Whether this contractor gets the AI Marketing Toolkit as part of their plan.
 * Fails open when the tier is unknown/unset so we never lock out a legitimate
 * contractor while tier data is still being backfilled.
 */
export function contractorHasAiToolkit(
  profile: Parameters<typeof resolveBaseTierId>[0],
): boolean {
  const tier = resolveBaseTierId(profile);
  if (tier == null) return true;
  return AI_TOOLKIT_TIERS.includes(tier);
}
