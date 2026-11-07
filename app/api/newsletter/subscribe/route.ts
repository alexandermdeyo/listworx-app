import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, source } = body as { email?: string; name?: string; source?: string };

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const normalized = email.trim().toLowerCase();
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalized, name: name || null, source: source || 'website' });

    if (error) {
      // Postgres unique violation code: already on the list. Re-activate if they had unsubscribed.
      if (error.code === '23505') {
        await supabase
          .from('newsletter_subscribers')
          .update({ active: true, unsubscribed_at: null })
          .eq('email', normalized)
          .eq('active', false);
        return NextResponse.json({ ok: true, alreadySubscribed: true });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
