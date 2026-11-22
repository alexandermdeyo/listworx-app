/**
 * Appointment slot math for ListWorx Media Services. Self-contained so it can be
 * unit tested. Times are stored in UTC; availability is defined in local time
 * (America/Chicago by default) and converted with Intl, so DST is handled.
 */

export type Rule = { weekday: number; start_time: string; end_time: string };
export type Exception = { date: string; kind: 'open' | 'blocked'; start_time: string | null; end_time: string | null };
export type Busy = { block_start: string; block_end: string };
export type ScheduleSettings = {
  timezone: string;
  slot_interval_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  booking_window_days: number;
  /** Earliest local start time for any appointment (HH:MM). Defaults to EARLIEST_START. */
  earliest_start?: string;
};

/** Owner rule (Nov 22 2026): no appointment starts before 3:30 PM local time. */
export const EARLIEST_START = '15:30';

const MIN = 60_000;

/** Offset (minutes) of a time zone from UTC at a given instant. */
function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - instant.getTime()) / MIN);
}

/** Local wall-clock date (YYYY-MM-DD) + time (HH:MM) in a zone → UTC Date. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = tzOffsetMinutes(new Date(guess), timeZone);
  let utc = guess - off * MIN;
  const off2 = tzOffsetMinutes(new Date(utc), timeZone);
  if (off2 !== off) utc = guess - off2 * MIN;
  return new Date(utc);
}

/** Local date string (YYYY-MM-DD) for an instant in a zone. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/** Open windows (local minutes) for a date after applying rules and exceptions. */
export function openWindows(date: string, rules: Rule[], exceptions: Exception[]): Array<[number, number]> {
  const dayEx = exceptions.filter((e) => e.date === date);
  if (dayEx.some((e) => e.kind === 'blocked' && !e.start_time)) return [];
  let windows: Array<[number, number]> = rules
    .filter((r) => r.weekday === weekdayOf(date))
    .map((r) => [toMinutes(r.start_time), toMinutes(r.end_time)]);
  for (const e of dayEx) if (e.kind === 'open' && e.start_time && e.end_time) windows.push([toMinutes(e.start_time), toMinutes(e.end_time)]);
  // Remove blocked hours.
  for (const e of dayEx) {
    if (e.kind !== 'blocked' || !e.start_time || !e.end_time) continue;
    const bs = toMinutes(e.start_time);
    const be = toMinutes(e.end_time);
    windows = windows.flatMap(([s, en]) => {
      if (be <= s || bs >= en) return [[s, en]] as Array<[number, number]>;
      const out: Array<[number, number]> = [];
      if (bs > s) out.push([s, bs]);
      if (be < en) out.push([be, en]);
      return out;
    });
  }
  return windows.sort((a, b) => a[0] - b[0]);
}

export type Slot = { starts_at: string; ends_at: string; block_start: string; block_end: string; label: string };

/** Build the reservation range for an appointment (buffer on both sides). */
export function slotFor(startsAt: Date, durationMinutes: number, bufferMinutes: number, timeZone: string): Slot {
  const ends = new Date(startsAt.getTime() + durationMinutes * MIN);
  return {
    starts_at: startsAt.toISOString(),
    ends_at: ends.toISOString(),
    block_start: new Date(startsAt.getTime() - bufferMinutes * MIN).toISOString(),
    block_end: new Date(ends.getTime() + bufferMinutes * MIN).toISOString(),
    label: new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(startsAt),
  };
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/**
 * Available start times on a local date for a visit of `durationMinutes`.
 * The whole visit must fit inside an open window, start after the minimum
 * notice, sit inside the booking window, and its buffered range must not
 * overlap any live hold/request/confirmed/blocked range.
 */
export function availableSlots(opts: {
  date: string;
  durationMinutes: number;
  settings: ScheduleSettings;
  rules: Rule[];
  exceptions: Exception[];
  busy: Busy[];
  now?: Date;
}): Slot[] {
  const { date, durationMinutes, settings, rules, exceptions, busy } = opts;
  const now = opts.now || new Date();
  const tz = settings.timezone;
  const earliest = now.getTime() + settings.min_notice_hours * 60 * MIN;
  const latest = now.getTime() + settings.booking_window_days * 24 * 60 * MIN;
  const busyRanges = busy.map((b) => [Date.parse(b.block_start), Date.parse(b.block_end)] as const);
  const step = Math.max(15, settings.slot_interval_minutes);
  const slots: Slot[] = [];
  const floor = toMinutes(settings.earliest_start || EARLIEST_START);
  for (const [ws, we] of openWindows(date, rules, exceptions)) {
    // Start at the window's opening or the earliest allowed start, whichever is later.
    for (let m = Math.max(ws, floor); m + durationMinutes <= we; m += step) {
      const start = zonedToUtc(date, fromMinutes(m), tz);
      if (start.getTime() < earliest || start.getTime() > latest) continue;
      const slot = slotFor(start, durationMinutes, settings.buffer_minutes, tz);
      const bs = Date.parse(slot.block_start);
      const be = Date.parse(slot.block_end);
      if (busyRanges.some(([s, e]) => overlaps(bs, be, s, e))) continue;
      slots.push(slot);
    }
  }
  return slots;
}

/** True when a requested start time is one of the published available slots. */
export function isPublishedSlot(startsAtIso: string, slots: Slot[]): boolean {
  const t = Date.parse(startsAtIso);
  return Number.isFinite(t) && slots.some((s) => Date.parse(s.starts_at) === t);
}

/** True when two buffered visits (e.g. Before-and-After) overlap each other. */
export function slotsOverlap(a: Slot, b: Slot): boolean {
  return overlaps(Date.parse(a.block_start), Date.parse(a.block_end), Date.parse(b.block_start), Date.parse(b.block_end));
}
