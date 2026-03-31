export const PARTNER_STATUS = {
  APPLIED: 'applied',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAUSED: 'paused',
  REJECTED: 'rejected',
} as const;

export type PartnerStatus = typeof PARTNER_STATUS[keyof typeof PARTNER_STATUS];
