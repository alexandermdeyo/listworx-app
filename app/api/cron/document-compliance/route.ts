import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/send-email';
import { brandedEmail, detailRows, esc, notifyAdmin, BASE_URL } from '@/lib/server/notify';
import { runComplianceJob, type JobDeps, type JobDoc } from '@/lib/compliance/job';
import type { NoticeKind } from '@/lib/compliance/rules';

export const dynamic = 'force-dynamic';

/** Only the scheduled function (which knows CRON_SECRET) may run the job. */
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || '';
  const header = request.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

const TYPE_LABEL: Record<string, string> = { LICENSE: 'license', INSURANCE: 'insurance certificate' };
const fmt = (d: string | null) => {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createSupabaseAdminClient();

  const deps: JobDeps = {
    async loadDocs() {
      const { data, error } = await db
        .from('contractor_documents')
        .select('id, contractor_id, document_type, status, expiration_date, created_at, contractor_profiles!inner(company_name, email, archived)')
        .in('document_type', ['LICENSE', 'INSURANCE'])
        .eq('contractor_profiles.archived', false);
      if (error) throw error;
      return (data || []).map((d: any): JobDoc => ({
        id: d.id,
        contractor_id: d.contractor_id,
        document_type: d.document_type,
        status: d.status,
        expiration_date: d.expiration_date,
        created_at: d.created_at,
        company_name: d.contractor_profiles?.company_name ?? null,
        contact_email: d.contractor_profiles?.email ?? null,
      }));
    },
    async loadSent(docIds) {
      const map = new Map<string, Set<string>>();
      if (!docIds.length) return map;
      const { data, error } = await db.from('document_notifications').select('document_id, kind').in('document_id', docIds);
      if (error) throw error;
      for (const row of data || []) {
        if (!map.has(row.document_id)) map.set(row.document_id, new Set());
        map.get(row.document_id)!.add(row.kind);
      }
      return map;
    },
    async claim(docId, kind) {
      // Unique (document_id, kind): the insert succeeds for exactly one sender.
      const { data, error } = await db
        .from('document_notifications')
        .upsert({ document_id: docId, kind }, { onConflict: 'document_id,kind', ignoreDuplicates: true })
        .select('id');
      if (error) throw error;
      return Boolean(data && data.length);
    },
    async release(docId, kind) {
      await db.from('document_notifications').delete().eq('document_id', docId).eq('kind', kind);
    },
    async markExpired(docIds) {
      const { error } = await db.from('contractor_documents').update({ status: 'EXPIRED' }).in('id', docIds).eq('status', 'APPROVED');
      if (error) throw error;
    },
    async emailContractor(doc: JobDoc, kind: NoticeKind, daysLeft: number) {
      if (!doc.contact_email) throw new Error('contractor has no email on file');
      const what = TYPE_LABEL[doc.document_type] || 'document';
      const expired = kind === 'expired';
      const title = expired ? `Your ${what} on file has expired` : `Your ${what} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
      const body = expired
        ? `<p>The ${esc(what)} ListWorx has on file for ${esc(doc.company_name)} expired on ${esc(fmt(doc.expiration_date))}.</p>
           <p>Upload your renewed ${esc(what)} in your dashboard. ListWorx reviews each upload; while no current, approved ${esc(what)} is on file you may not receive new referrals. Your account, subscription and past referrals are not affected.</p>`
        : `<p>The ${esc(what)} ListWorx has on file for ${esc(doc.company_name)} expires on ${esc(fmt(doc.expiration_date))}.</p>
           <p>Upload the renewed ${esc(what)} in your dashboard before then so ListWorx can review it without a gap in your referral eligibility.</p>`;
      await sendEmail({
        to: doc.contact_email,
        subject: `ListWorx: ${title}`,
        html: brandedEmail({ kicker: 'Compliance documents', title, body, ctaLabel: 'Upload in Documents', ctaHref: `${BASE_URL}/contractor-dashboard` }),
      });
    },
    async emailAdmin({ expired, pending }) {
      const row = (d: JobDoc) => detailRows([
        ['Contractor', d.company_name],
        ['Document', TYPE_LABEL[d.document_type] || d.document_type],
        ['Expiration', fmt(d.expiration_date)],
      ]);
      const html = brandedEmail({
        kicker: 'Admin — compliance',
        title: `${expired.length} expired, ${pending.length} awaiting review`,
        body: `${expired.length ? `<p><strong>Expired documents</strong></p>${expired.map(row).join('')}` : ''}
               ${pending.length ? `<p><strong>New uploads awaiting your review</strong></p>${pending.map(row).join('')}` : ''}`,
        ctaLabel: 'Open admin CRM',
        ctaHref: `${BASE_URL}/admin/crm/contractors`,
      });
      // notifyAdmin never throws; turn a failed send into an error so the job retries tomorrow.
      const sent = await notifyAdmin(`ListWorx compliance: ${expired.length} expired, ${pending.length} pending review`, html);
      if (!sent) throw new Error('admin digest email failed');
    },
    log: (msg, data) => console.warn('[cron/document-compliance]', msg, data ?? ''),
  };

  try {
    const summary = await runComplianceJob(deps);
    console.log('[cron/document-compliance] done', summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[cron/document-compliance] failed:', error);
    return NextResponse.json({ error: 'Compliance job failed.' }, { status: 500 });
  }
}
