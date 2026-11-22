import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/server/require-admin';
import { getVerifiedMembership } from '@/lib/server/membership';
import { periodMonth, socialPostAllowance } from '@/lib/membership/benefits';
import { notifyAdmin, brandedEmail, detailRows, BASE_URL } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

async function context(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const m = await getVerifiedMembership(user.id);
  return m.contractorId ? m : null;
}

/** Contractor: this month's Business Pro social post requests and allowance. */
export async function GET(request: NextRequest) {
  const m = await context(request);
  if (!m) return NextResponse.json({ error: 'Contractor sign-in required.' }, { status: 401 });
  const month = periodMonth();
  const { data } = await createSupabaseAdminClient()
    .from('social_post_requests')
    .select('id, period_month, slot_number, status, topic, details, photo_links, platforms, revision_used, revision_notes, deliverable_url, caption, created_at')
    .eq('contractor_id', m.contractorId)
    .order('created_at', { ascending: false })
    .limit(24);
  const allowance = socialPostAllowance(m.tier);
  const usedThisMonth = (data || []).filter((r: any) => r.period_month === month).length;
  return NextResponse.json({ tier: m.tier, allowance, usedThisMonth, remaining: Math.max(0, allowance - usedThisMonth), month, requests: data || [] });
}

/** Contractor: create a request (Business Pro, 2 per calendar month) or ask for the one revision. */
export async function POST(request: NextRequest) {
  const m = await context(request);
  if (!m) return NextResponse.json({ error: 'Contractor sign-in required.' }, { status: 401 });
  const db = createSupabaseAdminClient();
  const b = await request.json().catch(() => ({}));

  if (b.action === 'revision') {
    const notes = String(b.notes || '').trim().slice(0, 2000);
    if (!notes) return NextResponse.json({ error: 'Tell us what to change.' }, { status: 400 });
    const { data, error } = await db
      .from('social_post_requests')
      .update({ status: 'revision_requested', revision_used: true, revision_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', String(b.id))
      .eq('contractor_id', m.contractorId)
      .eq('status', 'delivered')
      .eq('revision_used', false)
      .select('id')
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'A revision is available once per delivered post.' }, { status: 400 });
    await notifyAdmin('✏️ Social post revision requested', brandedEmail({ kicker: 'Admin alert', title: 'Revision requested', body: detailRows([['Notes', notes]]), ctaLabel: 'Open social posts', ctaHref: `${BASE_URL}/admin/crm/social-posts` }));
    return NextResponse.json({ ok: true });
  }

  const allowance = socialPostAllowance(m.tier);
  if (!allowance) return NextResponse.json({ error: 'Custom branded social posts are included with Business Pro.' }, { status: 403 });
  const topic = String(b.topic || '').trim().slice(0, 200);
  if (!topic) return NextResponse.json({ error: 'Tell us what the post should be about.' }, { status: 400 });
  const month = periodMonth();
  const { data: existing } = await db.from('social_post_requests').select('slot_number').eq('contractor_id', m.contractorId).eq('period_month', month);
  const used = new Set((existing || []).map((r: any) => r.slot_number));
  const slot = [1, 2].find((n) => !used.has(n));
  if (!slot) return NextResponse.json({ error: "You've used both social posts for this month. Your allowance resets on the 1st." }, { status: 409 });
  const { error } = await db.from('social_post_requests').insert({
    contractor_id: m.contractorId,
    period_month: month,
    slot_number: slot,
    topic,
    details: String(b.details || '').trim().slice(0, 3000) || null,
    photo_links: String(b.photo_links || '').trim().slice(0, 2000) || null,
    platforms: String(b.platforms || '').trim().slice(0, 200) || null,
  });
  if (error) {
    // Unique (contractor, month, slot) stops a double submit from exceeding the allowance.
    return NextResponse.json({ error: error.code === '23505' ? "You've used both social posts for this month." : 'Could not save your request.' }, { status: error.code === '23505' ? 409 : 500 });
  }
  const { data: prof } = await db.from('contractor_profiles').select('company_name, owner_name').eq('id', m.contractorId).maybeSingle();
  await notifyAdmin(
    `🎨 Social post request: ${prof?.company_name || 'Business Pro member'}`,
    brandedEmail({
      kicker: 'Admin alert',
      title: 'New Business Pro social post request',
      body: detailRows([['Business', prof?.company_name], ['Contact', prof?.owner_name], ['Month', month.slice(0, 7)], ['Post', `${slot} of 2`], ['Topic', topic], ['Details', b.details], ['Photos', b.photo_links], ['Platforms', b.platforms]]),
      ctaLabel: 'Open social posts',
      ctaHref: `${BASE_URL}/admin/crm/social-posts`,
    }),
  );
  return NextResponse.json({ ok: true });
}
