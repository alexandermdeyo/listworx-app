export const PARTNER_STATUS = {
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  REMOVED: 'removed',
} as const;

export type PartnerStatus = typeof PARTNER_STATUS[keyof typeof PARTNER_STATUS];