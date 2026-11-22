import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { sendEmail } from '@/lib/send-email';
import { brandedEmail, BASE_URL, esc } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

const STATUSES = ['requested', 'in_progress', 'delivered', 'revision_requested', 'completed', 'canceled'];

export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await createSupabaseAdminClient()
    .from('social_post_requests')
    .select('*, contractor_profiles(company_name, owner_name, user_id)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createSupabaseAdminClient();
  const b = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.status) {
    if (!STATUSES.includes(b.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    patch.status = b.status;
  }
  for (const k of ['deliverable_url', 'caption', 'admin_notes']) if (k in b) patch[k] = String(b[k] ?? '').slice(0, 5000) || null;
  const { data, error } = await db
    .from('social_post_requests')
    .update(patch)
    .eq('id', String(b.id))
    .select('*, contractor_profiles(company_name, user_id)')
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: error?.message || 'Not found' }, { status: 400 });

  if (b.status === 'delivered' && data.contractor_profiles?.user_id) {
    const { data: u } = await db.from('users').select('email, name').eq('id', data.contractor_profiles.user_id).maybeSingle();
    if (u?.email) {
      try {
        await sendEmail({
          to: u.email,
          subject: 'Your ListWorx social post is ready',
          replyTo: 'adeyo@listworx.co',
          html: brandedEmail({
            kicker: 'Business Pro',
            title: 'Your social post is ready',
            body: `<p>Your post "${esc(data.topic)}" is ready to download and publish. ${data.revision_used ? '' : 'If something needs a change, you can request one revision from your dashboard.'}</p>`,
            ctaLabel: 'Open your dashboard',
            ctaHref: `${BASE_URL}/contractor-dashboard/social-posts`,
          }),
        });
      } catch (err) {
        console.error('[admin/social-posts] delivery email failed', err);
      }
    }
  }
  return NextResponse.json({ ok: true, request: data });
}
