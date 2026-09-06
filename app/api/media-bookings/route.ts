import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { resolveBaseTierId } from '@/lib/tiers-config';

export const dynamic = 'force-dynamic';

const BOOKING_COLS =
  'id, media_partner_id, requester_type, requester_user_id, requester_contractor_id, requester_realtor_id, source, status, property_address, preferred_date, notes, decline_reason, job_value, commission_rate, commission_owed, partner_payout, quarter, requested_at, confirmed_at, completed_at';

function currentQuarter(d = new Date()) {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

async function getAuth() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const admin = createSupabaseAdminClient();
  const { data: userRow } = await admin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  return { userId: session.user.id, role: userRow?.role || null, admin };
}

/* ── GET ─────────────────────────────────────────────────────────────
   ?as=partner    bookings where I'm the media partner
   ?as=requester  bookings I created
   ?all=true      (admin) everything
   ?report=YYYY-MM  (admin) completed dashboard bookings that month, per partner
   ─────────────────────────────────────────────────────────────────── */
export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { admin, userId, role } = auth;

  if (searchParams.get('report')) {
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const month = searchParams.get('report')!; // YYYY-MM
    const start = `${month}-01T00:00:00Z`;
    const end = new Date(new Date(start).setUTCMonth(new Date(start).getUTCMonth() + 1))
      .toISOString();

    const { data, error } = await admin
      .from('media_bookings')
      .select(
        'media_partner_id, job_value, commission_owed, completed_at, contractor_profiles!media_bookings_media_partner_id_fkey(company_name)',
      )
      .eq('source', 'dashboard')
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lt('completed_at', end);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byPartner: Record<string, { name: string; jobs: number; job_total: number; commission_total: number }> = {};
    (data || []).forEach((r: any) => {
      const k = r.media_partner_id;
      byPartner[k] ||= {
        name: r.contractor_profiles?.company_name || 'Unknown',
        jobs: 0,
        job_total: 0,
        commission_total: 0,
      };
      byPartner[k].jobs += 1;
      byPartner[k].job_total += Number(r.job_value || 0);
      byPartner[k].commission_total += Number(r.commission_owed || 0);
    });

    return NextResponse.json({
      month,
      rows: Object.entries(byPartner).map(([media_partner_id, v]) => ({ media_partner_id, ...v })),
    });
  }

  let query = admin.from('media_bookings').select(BOOKING_COLS).order('requested_at', { ascending: false });

  if (searchParams.get('all') === 'true') {
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } else if (searchParams.get('as') === 'partner') {
    const { data: cp } = await admin
      .from('contractor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    query = query.eq('media_partner_id', cp?.id || '00000000-0000-0000-0000-000000000000');
  } else {
    query = query.eq('requester_user_id', userId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data || [] });
}

/* ── POST — create a request ─────────────────────────────────────────
   body: { media_partner_id, notes, property_address?, preferred_date?,
           elite_quarterly?: boolean }
   ─────────────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId, role } = auth;

  const body = await request.json();
  const media_partner_id = String(body.media_partner_id || '');
  if (!media_partner_id) {
    return NextResponse.json({ error: 'media_partner_id is required' }, { status: 400 });
  }

  // Confirm the target really is an active media partner.
  const { data: partner } = await admin
    .from('contractor_profiles')
    .select('id, is_media_partner, partner_status')
    .eq('id', media_partner_id)
    .maybeSingle();
  if (!partner?.is_media_partner || partner.partner_status !== 'active') {
    return NextResponse.json({ error: 'That media partner is not available.' }, { status: 400 });
  }

  const row: Record<string, any> = {
    media_partner_id,
    requester_user_id: userId,
    property_address: (body.property_address || '').trim() || null,
    preferred_date: body.preferred_date || null,
    notes: (body.notes || '').trim(),
    status: 'requested',
  };

  if (role === 'CONTRACTOR') {
    const { data: cp } = await admin
      .from('contractor_profiles')
      .select('id, subscription_tier, founder_tier')
      .eq('user_id', userId)
      .maybeSingle();
    if (!cp) return NextResponse.json({ error: 'Contractor profile not found.' }, { status: 400 });

    row.requester_type = 'contractor';
    row.requester_contractor_id = cp.id;

    if (body.elite_quarterly === true) {
      if (resolveBaseTierId(cp) !== 'elite') {
        return NextResponse.json(
          { error: 'Quarterly media sessions are an Elite-tier benefit.' },
          { status: 403 },
        );
      }
      row.source = 'elite_quarterly';
      row.quarter = currentQuarter();
    } else {
      row.source = 'dashboard';
    }
  } else {
    // realtor / homeowner / property manager — sourced through the referral pool
    const { data: rp } = await admin
      .from('requestor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    row.requester_type = 'realtor';
    row.requester_realtor_id = rp?.id || null;
    row.source = 'realtor_referral_pool';
  }

  const { data, error } = await admin
    .from('media_bookings')
    .insert(row)
    .select(BOOKING_COLS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `You've already booked your ${row.quarter} quarterly session.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/* ── PATCH — confirm / decline / complete / cancel ───────────────────
   body: { id, action, reason?, job_value? }
   ─────────────────────────────────────────────────────────────────── */
export async function PATCH(request: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { admin, userId, role } = auth;

  const body = await request.json();
  const { id, action } = body;
  if (!id || !['confirm', 'decline', 'complete', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'id and a valid action are required' }, { status: 400 });
  }

  const { data: booking } = await admin
    .from('media_bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const { data: myCp } = await admin
    .from('contractor_profiles')
    .select('id, media_quarterly_rate')
    .eq('user_id', userId)
    .maybeSingle();
  const isPartner = myCp?.id && myCp.id === booking.media_partner_id;
  const isRequester = booking.requester_user_id === userId;
  const isAdmin = role === 'ADMIN';

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  if (action === 'cancel') {
    if (!isRequester && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!['requested', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot cancel a ${booking.status} booking.` }, { status: 400 });
    }
    updates.status = 'cancelled';
  } else {
    if (!isPartner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'confirm') {
      if (booking.status !== 'requested') {
        return NextResponse.json({ error: `Cannot confirm a ${booking.status} booking.` }, { status: 400 });
      }
      updates.status = 'confirmed';
      updates.confirmed_at = new Date().toISOString();
      if (booking.source === 'elite_quarterly') {
        updates.partner_payout = myCp?.media_quarterly_rate ?? null;
      }
    } else if (action === 'decline') {
      if (!['requested', 'confirmed'].includes(booking.status)) {
        return NextResponse.json({ error: `Cannot decline a ${booking.status} booking.` }, { status: 400 });
      }
      updates.status = 'declined';
      updates.decline_reason = (body.reason || '').trim() || null;
    } else if (action === 'complete') {
      if (booking.status !== 'confirmed') {
        return NextResponse.json({ error: 'Confirm the booking before marking it complete.' }, { status: 400 });
      }
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
      if (booking.source === 'dashboard') {
        const jv = Number(body.job_value);
        if (!Number.isFinite(jv) || jv <= 0) {
          return NextResponse.json(
            { error: 'A final job value is required to complete a contractor-sourced booking.' },
            { status: 400 },
          );
        }
        updates.job_value = jv; // commission_owed is a generated column
      }
    }
  }

  const { data, error } = await admin
    .from('media_bookings')
    .update(updates)
    .eq('id', id)
    .select(BOOKING_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
