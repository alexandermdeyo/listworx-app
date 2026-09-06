import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const KINDS = ['supplier', 'brokerage'] as const;
const STATUSES = ['new', 'contacted', 'archived'] as const;

const ADMIN_COLUMNS =
  'id, kind, org_name, contact_name, email, phone, details, status, created_at';

/** Bearer-token admin check — same pattern as /api/promo-partners. */
async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'ADMIN') return null;
  return supabase;
}

// POST /api/partner-inquiry — public submission from the partner marketing pages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kind = String(body.kind || '');
    const org_name = String(body.org_name || '').trim();
    const contact_name = String(body.contact_name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const details = String(body.details || '').trim();

    if (!KINDS.includes(kind as (typeof KINDS)[number])) {
      return NextResponse.json({ error: 'Invalid inquiry type' }, { status: 400 });
    }
    if (!org_name || !contact_name || !email) {
      return NextResponse.json(
        { error: 'Business name, contact name, and email are required' },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from('partner_inquiries').insert([
      { kind, org_name, contact_name, email, phone: phone || null, details, status: 'new' },
    ]);

    if (error) {
      console.error('[partner-inquiry] insert failed:', error);
      return NextResponse.json({ error: 'Could not submit your inquiry' }, { status: 500 });
    }

    // Best-effort admin notification (mirrors /api/contact).
    const adminEmail = process.env.ADMIN_EMAIL || 'adeyo@listworx.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          type: 'admin_new_job_request',
          to: adminEmail,
          realtorName: contact_name,
          clientName: `[${kind.toUpperCase()} PARTNER INQUIRY] ${org_name}`,
          clientEmail: email,
          clientPhone: phone || 'Not provided',
          propertyAddress: `NOT a job request — ${kind} partner inquiry. Details: ${details.slice(0, 200) || '(none provided)'}`,
          services: [],
          matchedContractors: 0,
        }),
      }).catch((err) => console.error('[partner-inquiry] admin notification failed:', err));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[partner-inquiry] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/partner-inquiry?all=true — admin list
export async function GET(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('partner_inquiries')
    .select(ADMIN_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inquiries: data || [] });
}

// PATCH /api/partner-inquiry — admin status update
export async function PATCH(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('partner_inquiries')
    .update({ status })
    .eq('id', id)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/partner-inquiry?id=... — admin remove
export async function DELETE(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('partner_inquiries').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
