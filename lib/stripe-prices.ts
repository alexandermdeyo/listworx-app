export const STRIPE_PRICES = {

  tiers: {
    basic: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
      annual:  process.env.STRIPE_PRICE_BASIC_ANNUAL!,
    },
    preferred: {
      monthly: process.env.STRIPE_PRICE_PREFERRED_MONTHLY!,
      annual:  process.env.STRIPE_PRICE_PREFERRED_ANNUAL!,
    },
    elite: {
      monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY!,
      annual:  process.env.STRIPE_PRICE_ELITE_ANNUAL!,
    },
  },

  founder: {
    activation:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDER_ACTIVATION!,
    renewal: {
      basic: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL!,
        annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL_ANNUAL!,
      },
      preferred: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL!,
        annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL_ANNUAL!,
      },
      elite: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL!,
        annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL_ANNUAL!,
      },
    },
  },

  addons: {
    onetime: {
      ironclad_badge_kit:
        process.env.STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME!,
      decal_package_founder:
        process.env.STRIPE_ADDON_DECAL_PACKAGE_FOUNDER!,
      decal_package_standard:
        process.env.STRIPE_ADDON_DECAL_PACKAGE_STANDARD!,
      google_business_optimization:
        process.env.STRIPE_ADDON_GOOGLE_BUSINESS_ONETIME!,
      profile_video_standard:
        process.env.STRIPE_ADDON_PROFILE_VIDEO_ONETIME!,
      profile_video_elite:
        process.env.STRIPE_ADDON_PROFILE_VIDEO_ELITE_ONETIME!,
    },
    monthly: {
      social_content_standard:
        process.env.STRIPE_ADDON_SOCIAL_CONTENT_MONTHLY!,
      social_content_elite:
        process.env.STRIPE_ADDON_SOCIAL_CONTENT_ELITE_MONTHLY!,
      flyer_builder_basic:
        process.env.STRIPE_ADDON_FLYER_BUILDER_BASIC_MONTHLY!,
      featured_spotlight:
        process.env.STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY!,
    },
  },
}

export type TierId = 'basic' | 'preferred' | 'elite'
export type BillingPeriod = 'monthly' | 'annual'

export function getTierPriceId(
  tierId: TierId,
  billingPeriod: BillingPeriod
): string {
  return STRIPE_PRICES.tiers[tierId][billingPeriod]
}

export function getFounderActivationPriceId(): string {
  return STRIPE_PRICES.founder.activation
}

export function getFounderRenewalPriceId(
  tierId: TierId,
  billingPeriod: BillingPeriod = 'monthly'
): string {
  return STRIPE_PRICES.founder.renewal[tierId][billingPeriod]
}

export function getAddonPriceId(
  addonId: string,
  tierId?: TierId
): string | null {

  // Tier-aware add-ons (different price for Elite)
  if (addonId === 'social_content_pack' ||
      addonId === 'social_media_content_pack') {
    if (tierId === 'elite')
      return STRIPE_PRICES.addons.monthly.social_content_elite
    return STRIPE_PRICES.addons.monthly.social_content_standard
  }

  if (addonId === 'flyer_builder') {
    return STRIPE_PRICES.addons.monthly.flyer_builder_basic
  }

  if (addonId === 'featured_spotlight') {
    return STRIPE_PRICES.addons.monthly.featured_spotlight
  }

  const onetimeMap: Record<string, string> = {
    ironclad_badge_kit:
      STRIPE_PRICES.addons.onetime.ironclad_badge_kit,
    decal_package_founder:
      STRIPE_PRICES.addons.onetime.decal_package_founder,
    decal_package_standard:
      STRIPE_PRICES.addons.onetime.decal_package_standard,
    google_business_optimization:
      STRIPE_PRICES.addons.onetime.google_business_optimization,
    profile_video_standard:
      STRIPE_PRICES.addons.onetime.profile_video_standard,
    profile_video_elite:
      STRIPE_PRICES.addons.onetime.profile_video_elite,
    contractor_profile_video:
      STRIPE_PRICES.addons.onetime.profile_video_standard,
  }

  return onetimeMap[addonId] ?? null
}

export function getAddonMode(addonId: string): 'payment' | 'subscription' {
  const subscriptionAddons = [
    'social_content_pack',
    'social_media_content_pack',
    'flyer_builder',
    'featured_spotlight',
    'profile_boost',
  ]
  return subscriptionAddons.includes(addonId) ? 'subscription' : 'payment'
}

export function normalizeFounderTier(tier: string): TierId {
  const normalized = tier.trim().toLowerCase()
  if (normalized.includes('elite')) return 'elite'
  if (normalized.includes('preferred')) return 'preferred'
  return 'basic'
}
