export const STRIPE_PRICE_ENV_VARS = {
  basicStandard: 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_STANDARD',
  preferredStandard: 'NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_STANDARD',
  eliteStandard: 'NEXT_PUBLIC_STRIPE_PRICE_ELITE_STANDARD',
  basicFounderRenewal: 'NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL',
  preferredFounderRenewal: 'NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL',
  eliteFounderRenewal: 'NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL',
  founderActivation: 'NEXT_PUBLIC_STRIPE_PRICE_FOUNDER_ACTIVATION',
} as const;

export function getFounderRenewalPriceId(tier: string) {
  const normalized = tier.trim().toLowerCase();
  if (normalized.includes('elite')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_FOUNDER_RENEWAL;
  if (normalized.includes('preferred')) return process.env.NEXT_PUBLIC_STRIPE_PRICE_PREFERRED_FOUNDER_RENEWAL;
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_FOUNDER_RENEWAL;
}

export function getFounderActivationPriceId() {
  return process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDER_ACTIVATION;
}

export function normalizeFounderTier(tier: string) {
  const normalized = tier.trim().toLowerCase();
  if (normalized.includes('elite')) return 'elite';
  if (normalized.includes('preferred')) return 'preferred';
  return 'basic';
}
