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
  activationFee: number;
  firstYear: string;
  renewalRate: number;
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
    name: 'Basic Partner',
    monthlyPrice: 199,
    annualPrice: 1990,
    annualMonthly: 166,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_BASIC_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_BASIC_ANNUAL',
    badge: null,
    territoryLock: false,
    rotationPriority: 'standard',
    highlighted: false,
    description: 'Get into the network and start receiving referrals in your trade and county.',
    included: [
      'Referral rotation — standard priority',
      'Basic contractor profile',
      'IronClad Standards certification',
      'Network membership',
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
    name: 'Preferred Partner',
    monthlyPrice: 349,
    annualPrice: 3490,
    annualMonthly: 291,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_PREFERRED_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_PREFERRED_ANNUAL',
    badge: null,
    territoryLock: false,
    rotationPriority: 'priority',
    highlighted: true,
    description: 'Priority positioning plus the tools that make your profile worth clicking.',
    included: [
      'Priority rotation — above all Basic members',
      'Enhanced contractor profile',
      'IronClad Standards certification',
      'Monthly Performance Report — included ($29 value)',
      'IronClad Digital Badge Kit on signup ($29 value)',
      '1 Profile Boost per quarter ($49 value)',
      'Access to all marketing add-ons',
    ],
    notIncluded: [
      'Additional Profile Boosts beyond quarterly',
      'Social Media Content Pack',
      'Google Business Optimization',
      'Territory lock',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Partner',
    monthlyPrice: 599,
    annualPrice: 5990,
    annualMonthly: 499,
    stripeMonthlyEnvVar: 'STRIPE_PRICE_ELITE_MONTHLY',
    stripeAnnualEnvVar: 'STRIPE_PRICE_ELITE_ANNUAL',
    badge: 'Elite',
    territoryLock: true,
    rotationPriority: 'top',
    highlighted: false,
    description: 'Own your territory. No other Elite contractor of your trade in your county.',
    included: [
      'Top of rotation — always above Preferred and Basic',
      'Territory lock — 2 Elite spots per trade per county',
      'Enhanced contractor profile',
      'IronClad Standards certification',
      'Monthly Performance Report — included ($29 value)',
      'IronClad Digital Badge Kit on signup ($29 value)',
      'Profile Boost every month — included ($49/mo value)',
      'Social Media Content Pack — 2 posts/month included',
      'Google Business Profile Optimization on signup ($149 value)',
      'Annual featured contractor spotlight on ListWorx social media',
    ],
    notIncluded: [],
  },
];

export const FOUNDER_TIERS: FounderTier[] = [
  {
    id: 'basic_founder',
    baseTierId: 'basic',
    name: 'Basic Founder',
    activationFee: 199,
    firstYear: 'Included',
    renewalRate: 159,
    standardRate: 199,
    savingsMonthly: 40,
    savingsAnnual: 480,
    spotsPerCounty: 10,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL',
    included: [
      'Everything in Basic Partner',
      'Founding Partner badge — permanent',
      'Territory reservation',
      'IronClad decal package — founder pricing ($49)',
      'Founding Partner certificate mailed to you',
      'Rate locked for life',
    ],
  },
  {
    id: 'preferred_founder',
    baseTierId: 'preferred',
    name: 'Preferred Founder',
    activationFee: 199,
    firstYear: 'Included',
    renewalRate: 279,
    standardRate: 349,
    savingsMonthly: 70,
    savingsAnnual: 840,
    spotsPerCounty: 5,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL',
    included: [
      'Everything in Preferred Partner',
      'Founding Partner badge — permanent',
      'Territory reservation',
      'IronClad decal package — founder pricing ($49)',
      'Founding Partner certificate mailed to you',
      'Rate locked for life',
    ],
  },
  {
    id: 'elite_founder',
    baseTierId: 'elite',
    name: 'Elite Founder',
    activationFee: 199,
    firstYear: 'Included',
    renewalRate: 479,
    standardRate: 599,
    savingsMonthly: 120,
    savingsAnnual: 1440,
    spotsPerCounty: 2,
    stripeRenewalEnvVar: 'NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL',
    included: [
      'Everything in Elite Partner',
      'Founding Partner badge — permanent',
      'Territory reservation — highest priority',
      'IronClad decal package — founder pricing ($49)',
      'Founding Partner certificate mailed to you',
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
    preferredPrice: 59,
    elitePrice: 49,
    includedIn: [],
    stripeMonthlyEnvVar: 'STRIPE_ADDON_AI_TOOLKIT_BASIC_MONTHLY',
    preferredStripeMonthlyEnvVar: 'STRIPE_ADDON_AI_TOOLKIT_PREFERRED_MONTHLY',
    eliteStripeMonthlyEnvVar: 'STRIPE_ADDON_AI_TOOLKIT_ELITE_MONTHLY',
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
