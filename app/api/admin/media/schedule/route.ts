import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { getBookableService } from '@/lib/media/catalog';

export const dynamic = 'force-dynamic';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** ADMIN: availability settings, weekly hours, exceptions, blocks, and upcoming appointments. */
export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const [settings, rules, exceptions, appts] = await Promise.all([
    db.from('media_schedule_settings').select('*').eq('id', 1).maybeSingle(),
    db.from('media_availability_rules').select('*').order('weekday').order('start_time'),
    db.from('media_availability_exceptions').select('*').gte('date', today).order('date'),
    db
      .from('media_appointments')
      .select('*, media_orders(id, order_number, customer_name, business_name, service_code, payment_status, fulfillment_status)')
      .in('status', ['requested', 'proposed', 'confirmed', 'blocked', 'completed', 'canceled'])
      .gte('ends_at', new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order('starts_at'),
  ]);
  return NextResponse.json({ settings: settings.data, rules: rules.data || [], exceptions: exceptions.data || [], appointments: appts.data || [] });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createSupabaseAdminClient();
  const b = await request.json().catch(() => ({}));
  const fail = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });
  switch (b.action) {
    case 'save_settings': {
      const durations: Record<string, number> = {};
      for (const [code, mins] of Object.entries(b.durations || {})) {
        const n = Math.round(Number(mins));
        if (getBookableService(code) && n >= 15 && n <= 720) durations[code] = n;
      }
      const patch = {
        buffer_minutes: Math.round(Number(b.buffer_minutes)),
        hold_minutes: Math.round(Number(b.hold_minutes)),
        slot_interval_minutes: Math.round(Number(b.slot_interval_minutes)),
        min_notice_hours: Math.round(Number(b.min_notice_hours)),
        booking_window_days: Math.round(Number(b.booking_window_days)),
        durations,
        updated_at: new Date().toISOString(),
      };
      const { error } = await db.from('media_schedule_settings').update(patch).eq('id', 1);
      if (error) return fail(error.message);
      break;
    }
    case 'add_rule': {
      const weekday = Number(b.weekday);
      if (!(weekday >= 0 && weekday <= 6) || !TIME.test(b.start_time) || !TIME.test(b.end_time) || b.end_time <= b.start_time) return fail('Enter a weekday and a valid start and end time.');
      const { error } = await db.from('media_availability_rules').insert({ weekday, start_time: b.start_time, end_time: b.end_time });
      if (error) return fail(error.message);
      break;
    }
    case 'delete_rule':
      await db.from('media_availability_rules').delete().eq('id', String(b.id));
      break;
    case 'add_exception': {
      const kind = b.kind === 'open' ? 'open' : 'blocked';
      if (!DATE.test(b.date)) return fail('Choose a date.');
      const hasTimes = TIME.test(b.start_time || '') && TIME.test(b.end_time || '');
      if (kind === 'open' && !hasTimes) return fail('An extra open date needs a start and end time.');
      if (hasTimes && b.end_time <= b.start_time) return fail('End time must be after start time.');
      const { error } = await db.from('media_availability_exceptions').insert({
        date: b.date,
        kind,
        start_time: hasTimes ? b.start_time : null,
        end_time: hasTimes ? b.end_time : null,
        note: String(b.note || '').slice(0, 200) || null,
      });
      if (error) return fail(error.message);
      break;
    }
    case 'delete_exception':
      await db.from('media_availability_exceptions').delete().eq('id', String(b.id));
      break;
    case 'add_block': {
      const s = new Date(String(b.starts_at));
      const e = new Date(String(b.ends_at));
      if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || e <= s) return fail('Enter a valid start and end.');
      const { error } = await db.from('media_appointments').insert({
        order_id: null,
        status: 'blocked',
        starts_at: s.toISOString(),
        ends_at: e.toISOString(),
        block_start: s.toISOString(),
        block_end: e.toISOString(),
        note: String(b.note || '').slice(0, 200) || null,
      });
      if (error) return fail(error.code === '23P01' ? 'That block overlaps an existing appointment.' : error.message, error.code === '23P01' ? 409 : 500);
      break;
    }
    case 'delete_block':
      await db.from('media_appointments').delete().eq('id', String(b.id)).eq('status', 'blocked').is('order_id', null);
      break;
    default:
      return fail('Unknown action');
  }
  return NextResponse.json({ ok: true });
}
