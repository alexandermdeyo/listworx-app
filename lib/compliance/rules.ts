/**
 * Insurance and license compliance rules (owner-approved 2026-11-10).
 * Pure functions, no framework or path-alias imports, so the real rules can be
 * unit tested (tests/compliance-*.test.mjs). The database view
 * public.contractor_compliance applies the same eligibility rule in SQL.
 */

export const REMINDER_DAYS = [60, 30, 14, 7] as const;
export type ReminderKind = 'expiry_60' | 'expiry_30' | 'expiry_14' | 'expiry_7';
export type NoticeKind = ReminderKind | 'expired' | 'admin_expired' | 'admin_pending';

export const COMPLIANCE_DOC_TYPES = ['LICENSE', 'INSURANCE'] as const;
export type ComplianceDocType = (typeof COMPLIANCE_DOC_TYPES)[number];
export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Today's date in Central time as YYYY-MM-DD — expiration dates are calendar dates. */
export function centralToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

/** Whole days from `today` to `expiration` (both YYYY-MM-DD). Negative = expired. */
export function daysUntil(expiration: string, today: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.slice(0, 10).split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((toUtc(expiration) - toUtc(today)) / 86_400_000);
}

/**
 * Which reminder notices to record and which one (at most) to email, given
 * days left and the notices already recorded for this document.
 * - Valid through the expiration date; expired the day after.
 * - If several thresholds are passed at once (e.g. a document first approved
 *   with 10 days left), only the closest one is emailed; the others are
 *   recorded so they are never sent later. No duplicates, no backfill spam.
 */
export function planReminder(daysLeft: number, alreadySent: Iterable<string>): {
  record: NoticeKind[];
  email: NoticeKind | null;
} {
  const sent = new Set(alreadySent);
  if (daysLeft < 0) {
    const record = (['expired', 'admin_expired'] as NoticeKind[]).filter((k) => !sent.has(k));
    return { record, email: record.includes('expired') ? 'expired' : null };
  }
  const due = REMINDER_DAYS.filter((d) => daysLeft <= d).map((d) => `expiry_${d}` as ReminderKind);
  const record = due.filter((k) => !sent.has(k));
  if (record.length === 0) return { record: [], email: null };
  const closest = due[due.length - 1];
  return { record, email: sent.has(closest) ? null : closest };
}

export type DashboardTone = 'ok' | 'notice' | 'warning' | 'urgent' | 'expired';

/** Dashboard banner level for a document: 60/30 notice, 14 warning, 7 urgent. */
export function warningTone(daysLeft: number | null): DashboardTone {
  if (daysLeft === null) return 'ok';
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 7) return 'urgent';
  if (daysLeft <= 14) return 'warning';
  if (daysLeft <= 60) return 'notice';
  return 'ok';
}

export type ComplianceRow = {
  contractor_id: string;
  referral_eligible: boolean;
  hold_reasons: string[] | null;
};

/**
 * Applies compliance holds to the matcher's candidate list WITHOUT changing
 * ranking: it only removes ids. When enforcement is off, nobody is removed and
 * would-be holds are reported for logging (shadow mode). When enforcement is on
 * and a candidate has no compliance row, it is held (fail closed).
 */
export function applyComplianceGate(
  candidateIds: string[],
  rows: ComplianceRow[] | null,
  enforced: boolean
): { allowedIds: string[]; held: { id: string; reasons: string[] }[] } {
  const byId = new Map((rows || []).map((r) => [r.contractor_id, r]));
  const held: { id: string; reasons: string[] }[] = [];
  const allowedIds: string[] = [];
  for (const id of candidateIds) {
    const row = byId.get(id);
    if (row?.referral_eligible) {
      allowedIds.push(id);
      continue;
    }
    held.push({ id, reasons: row?.hold_reasons?.length ? row.hold_reasons : ['compliance_status_unavailable'] });
    if (!enforced) allowedIds.push(id);
  }
  return { allowedIds, held };
}

export type ReviewInput = {
  status?: unknown;
  notes?: unknown;
  expirationDate?: unknown;
  licensingAuthority?: unknown;
  verificationNote?: unknown;
};

export type ReviewDoc = { document_type: string | null; expiration_date: string | null };

/**
 * Validates an administrator's review and builds the database update.
 * The reviewer and time are always recorded from the server, never the client.
 */
export function buildReviewUpdate(
  doc: ReviewDoc,
  input: ReviewInput,
  reviewerId: string,
  now: Date = new Date()
): { ok: true; update: Record<string, unknown> } | { ok: false; error: string } {
  const status = String(input.status || '').toUpperCase();
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'Invalid review status.' };
  }
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : null);
  let expiration = doc.expiration_date;
  if (input.expirationDate !== undefined && input.expirationDate !== null && input.expirationDate !== '') {
    if (typeof input.expirationDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.expirationDate)) {
      return { ok: false, error: 'Expiration date must be YYYY-MM-DD.' };
    }
    expiration = input.expirationDate;
  }
  const isCompliance = (COMPLIANCE_DOC_TYPES as readonly string[]).includes(String(doc.document_type));
  if (status === 'APPROVED' && isCompliance) {
    if (!expiration) return { ok: false, error: 'Add the expiration date before approving a license or insurance document.' };
    if (daysUntil(expiration, centralToday(now)) < 0) {
      return { ok: false, error: 'This document is already expired and cannot be approved as current.' };
    }
  }
  return {
    ok: true,
    update: {
      status,
      notes: text(input.notes) ?? '',
      expiration_date: expiration,
      licensing_authority: text(input.licensingAuthority),
      verification_note: text(input.verificationNote),
      reviewed_by: reviewerId,
      reviewed_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  };
}
