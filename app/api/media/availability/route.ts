import { NextRequest, NextResponse } from 'next/server';
import { buildMediaQuote, MediaQuoteError } from '@/lib/media/catalog';
import { availableDates, loadScheduleContext } from '@/lib/server/media-schedule';

export const dynamic = 'force-dynamic';

/** Public: open appointment dates/times for a service (and its add-ons). */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const service = sp.get('service') || '';
  const addons = (sp.get('addons') || '').split(',').filter(Boolean);
  const visit = sp.get('visit') === '2' ? 2 : 1;
  try {
    const quote = buildMediaQuote(service, addons, null);
    if (visit > quote.visits) return NextResponse.json({ error: 'This service has one visit.' }, { status: 400 });
    const ctx = await loadScheduleContext();
    const { minutes, dates } = availableDates(ctx, quote, visit);
    return NextResponse.json({
      timezone: ctx.settings.timezone,
      minutes,
      dates: dates.map((d) => ({ date: d.date, slots: d.slots.map((s) => ({ starts_at: s.starts_at, label: s.label })) })),
    });
  } catch (err: any) {
    if (err instanceof MediaQuoteError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('[media/availability]', err);
    return NextResponse.json({ error: 'Could not load availability.' }, { status: 500 });
  }
}
