/**
 * Daily document-compliance job: expiry reminders (60/30/14/7 days), marking
 * expired documents, and the admin digest of expired documents and pending
 * renewals. Framework-free; the route at app/api/cron/document-compliance
 * supplies database and email dependencies.
 *
 * Duplicate protection: each notice is "claimed" in document_notifications
 * (unique per document + kind) BEFORE it is sent. A failed send releases the
 * claim so the next run retries it. Two overlapping runs cannot both send.
 *
 * Delivery safeguard: at most ONE contractor email per contractor per run
 * (most urgent first). Any other notice due the same day is released and
 * sent on a following run, so a contractor is never flooded.
 *
 * Referral eligibility does NOT depend on this job — matching reads the live
 * contractor_compliance view.
 */
import { centralToday, daysUntil, planReminder, COMPLIANCE_DOC_TYPES, type NoticeKind } from './rules.ts';

export type JobDoc = {
  id: string;
  contractor_id: string;
  document_type: string;
  status: string;
  expiration_date: string | null;
  created_at: string;
  company_name: string | null;
  contact_email: string | null;
};

export type JobDeps = {
  loadDocs(): Promise<JobDoc[]>;
  loadSent(docIds: string[]): Promise<Map<string, Set<string>>>;
  claim(docId: string, kind: NoticeKind): Promise<boolean>;
  release(docId: string, kind: NoticeKind): Promise<void>;
  markExpired(docIds: string[]): Promise<void>;
  emailContractor(doc: JobDoc, kind: NoticeKind, daysLeft: number): Promise<void>;
  emailAdmin(digest: { expired: JobDoc[]; pending: JobDoc[] }): Promise<void>;
  log?(msg: string, data?: unknown): void;
};

export type JobSummary = { reminders: number; deferred: number; expiredMarked: number; adminExpired: number; adminPending: number; failures: number };

const isCompliance = (t: string) => (COMPLIANCE_DOC_TYPES as readonly string[]).includes(t);

export async function runComplianceJob(deps: JobDeps, now: Date = new Date()): Promise<JobSummary> {
  const today = centralToday(now);
  const docs = (await deps.loadDocs()).filter((d) => isCompliance(d.document_type));
  const summary: JobSummary = { reminders: 0, deferred: 0, expiredMarked: 0, adminExpired: 0, adminPending: 0, failures: 0 };

  // 1. Mark approved documents past their date as EXPIRED (status only; history kept).
  const toExpire = docs
    .filter((d) => d.status === 'APPROVED' && d.expiration_date && daysUntil(d.expiration_date, today) < 0)
    .map((d) => d.id);
  if (toExpire.length) {
    await deps.markExpired(toExpire);
    summary.expiredMarked = toExpire.length;
  }

  // 2. The document that matters per contractor + type: the approved (or just
  //    expired) one with the latest expiration date. Older ones are history.
  const latest = new Map<string, JobDoc>();
  for (const d of docs) {
    if (!d.expiration_date || !(d.status === 'APPROVED' || d.status === 'EXPIRED')) continue;
    const key = `${d.contractor_id}:${d.document_type}`;
    const cur = latest.get(key);
    if (!cur || (cur.expiration_date as string) < d.expiration_date) latest.set(key, d);
  }

  const pendingDocs = docs.filter((d) => d.status === 'PENDING');
  const sent = await deps.loadSent([...latest.values(), ...pendingDocs].map((d) => d.id));
  const adminExpired: JobDoc[] = [];
  const adminExpiredClaims: string[] = [];

  const emailedThisRun = new Set<string>();
  const byUrgency = [...latest.values()].sort((a, b) =>
    (a.expiration_date as string).localeCompare(b.expiration_date as string)
  );

  for (const doc of byUrgency) {
    const daysLeft = daysUntil(doc.expiration_date as string, today);
    const plan = planReminder(daysLeft, sent.get(doc.id) || []);
    for (const kind of plan.record) {
      if (!(await deps.claim(doc.id, kind))) continue; // another run already has it
      if (kind === 'admin_expired') {
        adminExpired.push(doc);
        adminExpiredClaims.push(doc.id);
        continue;
      }
      if (kind !== plan.email) continue; // passed thresholds are recorded, not emailed
      if (emailedThisRun.has(doc.contractor_id)) {
        await deps.release(doc.id, kind); // one email per contractor per day; this one goes next run
        summary.deferred += 1;
        continue;
      }
      try {
        await deps.emailContractor(doc, kind, daysLeft);
        emailedThisRun.add(doc.contractor_id);
        summary.reminders += 1;
      } catch (err) {
        summary.failures += 1;
        deps.log?.('contractor email failed; will retry next run', { doc: doc.id, kind, err: String(err) });
        await deps.release(doc.id, kind);
      }
    }
  }

  // 3. Pending renewals/uploads not yet reported to the admin.
  const adminPending: JobDoc[] = [];
  for (const doc of pendingDocs) {
    if (sent.get(doc.id)?.has('admin_pending')) continue;
    if (await deps.claim(doc.id, 'admin_pending')) adminPending.push(doc);
  }

  // 4. One admin digest per run.
  if (adminExpired.length || adminPending.length) {
    try {
      await deps.emailAdmin({ expired: adminExpired, pending: adminPending });
      summary.adminExpired = adminExpired.length;
      summary.adminPending = adminPending.length;
    } catch (err) {
      summary.failures += 1;
      deps.log?.('admin digest failed; will retry next run', { err: String(err) });
      for (const id of adminExpiredClaims) await deps.release(id, 'admin_expired');
      for (const d of adminPending) await deps.release(d.id, 'admin_pending');
    }
  }

  return summary;
}
