/**
 * Contractor email categories (owner decision 2026-11-10).
 *
 * essential — compliance-document notices, account security, billing and
 *   application status. Sent even when the contractor has turned off optional
 *   emails, because they affect their account or referral eligibility.
 * optional  — anything promotional or nice-to-know. Requires the contractor's
 *   email-notification setting (contractor_profiles.notification_email) to be on.
 *
 * Safeguards for essential email: only to the address on the contractor's account,
 * only factual account content (no promotions), a footer saying why it was sent,
 * de-duplicated per document and notice, and at most one compliance email per
 * contractor per day (lib/compliance/job.ts).
 */
export type EmailCategory = 'essential' | 'optional';

export type EmailRecipient = { email?: string | null; optionalEmailsEnabled?: boolean | null };

export type SendDecision = { send: true } | { send: false; reason: 'no_address' | 'opted_out' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function canSendContractorEmail(category: EmailCategory, to: EmailRecipient): SendDecision {
  if (!to.email || !EMAIL.test(to.email.trim())) return { send: false, reason: 'no_address' };
  if (category === 'optional' && to.optionalEmailsEnabled === false) return { send: false, reason: 'opted_out' };
  return { send: true };
}

export const ESSENTIAL_EMAIL_FOOTER =
  'This is a required notice about your ListWorx account and compliance documents. ' +
  'It is sent even if you have turned off optional email notifications.';
