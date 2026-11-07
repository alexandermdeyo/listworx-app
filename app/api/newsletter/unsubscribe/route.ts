import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

/** GET /api/newsletter/unsubscribe?token=<uuid>: one-click unsubscribe link in every newsletter. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  const ok = /^[0-9a-f-]{36}$/i.test(token);
  if (ok) {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from('newsletter_subscribers')
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq('unsubscribe_token', token);
  }
  return NextResponse.redirect(new URL(`/newsletter/unsubscribed${ok ? '' : '?invalid=1'}`, req.url));
}
