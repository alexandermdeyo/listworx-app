/**
 * Calendar dates stored without a time (e.g. expiration_date '2027-12-31').
 * `new Date('2027-12-31')` means midnight UTC, which shows as Dec 30 anywhere
 * west of UTC. These helpers read the date as a local calendar day instead, so
 * December 31 always displays as December 31.
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = DATE_ONLY.exec(value.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateOnly(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  const d = parseDateOnly(value);
  return d ? d.toLocaleDateString('en-US', options) : '';
}

function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from today to the date (0 = today, negative = past). */
export function daysUntilDateOnly(value: string | null | undefined, now: Date = new Date()): number | null {
  const d = parseDateOnly(value);
  if (!d) return null;
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - startOfToday(now).getTime()) / 86_400_000);
}

/** A document is valid through its expiration day; expired from the next day. */
export function isPastDateOnly(value: string | null | undefined, now: Date = new Date()): boolean {
  const days = daysUntilDateOnly(value, now);
  return days !== null && days < 0;
}
