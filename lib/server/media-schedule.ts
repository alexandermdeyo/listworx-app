import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { availableSlots, localDate, type Busy, type Exception, type Rule, type ScheduleSettings, type Slot } from '@/lib/media/schedule';
import { visitMinutes, type Quote } from '@/lib/media/catalog';

export type ScheduleContext = {
  settings: ScheduleSettings & { hold_minutes: number; durations: Record<string, number> };
  rules: Rule[];
  exceptions: Exception[];
  busy: Busy[];
};

const LIVE = ['hold', 'requested', 'proposed', 'confirmed', 'blocked'];

export async function loadScheduleContext(excludeOrderId?: string): Promise<ScheduleContext> {
  const db = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const [{ data: settings }, { data: rules }, { data: exceptions }, { data: busy }] = await Promise.all([
    db.from('media_schedule_settings').select('*').eq('id', 1).maybeSingle(),
    db.from('media_availability_rules').select('weekday, start_time, end_time'),
    db.from('media_availability_exceptions').select('date, kind, start_time, end_time').gte('date', nowIso.slice(0, 10)),
    db.from('media_appointments').select('order_id, status, hold_expires_at, block_start, block_end').in('status', LIVE).gte('block_end', nowIso),
  ]);
  const s = settings || {};
  return {
    settings: {
      timezone: s.timezone || 'America/Chicago',
      slot_interval_minutes: s.slot_interval_minutes ?? 30,
      buffer_minutes: s.buffer_minutes ?? 30,
      hold_minutes: s.hold_minutes ?? 35,
      min_notice_hours: s.min_notice_hours ?? 48,
      booking_window_days: s.booking_window_days ?? 60,
      durations: (s.durations as Record<string, number>) || {},
    },
    rules: (rules || []).map((r: any) => ({ weekday: r.weekday, start_time: String(r.start_time).slice(0, 5), end_time: String(r.end_time).slice(0, 5) })),
    exceptions: (exceptions || []).map((e: any) => ({
      date: e.date,
      kind: e.kind,
      start_time: e.start_time ? String(e.start_time).slice(0, 5) : null,
      end_time: e.end_time ? String(e.end_time).slice(0, 5) : null,
    })),
    // Expired holds no longer block time.
    busy: (busy || [])
      .filter((b: any) => !(b.status === 'hold' && b.hold_expires_at && Date.parse(b.hold_expires_at) < Date.now()))
      .filter((b: any) => !excludeOrderId || b.order_id !== excludeOrderId)
      .map((b: any) => ({ block_start: b.block_start, block_end: b.block_end })),
  };
}

/** Every bookable date in the booking window with its open start times. */
export function availableDates(ctx: ScheduleContext, quote: Pick<Quote, 'service' | 'addons'>, visit: number, now = new Date()) {
  const minutes = visitMinutes(quote, ctx.settings.durations, visit);
  const out: Array<{ date: string; slots: Slot[] }> = [];
  for (let i = 0; i <= ctx.settings.booking_window_days; i++) {
    const date = localDate(new Date(now.getTime() + i * 86_400_000), ctx.settings.timezone);
    if (out.some((d) => d.date === date)) continue;
    const slots = availableSlots({ date, durationMinutes: minutes, settings: ctx.settings, rules: ctx.rules, exceptions: ctx.exceptions, busy: ctx.busy, now });
    if (slots.length) out.push({ date, slots });
  }
  return { minutes, dates: out };
}
