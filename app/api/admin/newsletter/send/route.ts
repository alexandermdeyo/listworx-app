import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { newsletterEmailHtml, sendNewsletterBatch } from '@/lib/newsletter';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const supabase = createSupabaseAdminClient();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', userData.user.id).maybeSingle();
  if (profile?.role !== 'ADMIN') return null;
  return { supabase, email: userData.user.email };
}

/**
 * POST /api/admin/newsletter/send  { campaignId, testTo? }
 * With testTo: one [TEST] copy, campaign stays a draft. Without: sends to every active subscriber.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { supabase } = auth;

  try {
    const { campaignId, testTo } = await request.json();
    if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });

    const { data: campaign } = await supabase.from('newsletter_campaigns').select('*').eq('id', campaignId).maybeSingle();
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (testTo) {
      await sendNewsletterBatch([
        {
          to: String(testTo),
          subject: `[TEST] ${campaign.subject}`,
          html: newsletterEmailHtml({ bodyHtml: campaign.body_html, previewText: campaign.preview_text }),
        },
      ]);
      return NextResponse.json({ success: true, test: true });
    }

    // Lock so a double-click can't send twice.
    const { data: locked } = await supabase
      .from('newsletter_campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('status', 'draft')
      .select('id');
    if (!locked || locked.length === 0) {
      return NextResponse.json({ error: 'This campaign was already sent or is sending.' }, { status: 409 });
    }

    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .eq('active', true);
    if (subError || !subscribers) {
      await supabase.from('newsletter_campaigns').update({ status: 'draft' }).eq('id', campaignId);
      return NextResponse.json({ error: 'Could not load subscribers' }, { status: 500 });
    }

    try {
      await sendNewsletterBatch(
        subscribers.map((s) => ({
          to: s.email,
          subject: campaign.subject,
          html: newsletterEmailHtml({ bodyHtml: campaign.body_html, previewText: campaign.preview_text, unsubscribeToken: s.unsubscribe_token }),
        }))
      );
    } catch (err: any) {
      await supabase.from('newsletter_campaigns').update({ status: 'draft' }).eq('id', campaignId);
      return NextResponse.json({ error: err.message || 'Send failed' }, { status: 502 });
    }

    await supabase
      .from('newsletter_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: subscribers.length, updated_at: new Date().toISOString() })
      .eq('id', campaignId);

    return NextResponse.json({ success: true, sent: subscribers.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
