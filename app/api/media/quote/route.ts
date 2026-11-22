import { NextRequest, NextResponse } from 'next/server';
import { buildMediaQuote, MediaQuoteError } from '@/lib/media/catalog';
import { getRequestUser } from '@/lib/server/require-admin';
import { getVerifiedMembership } from '@/lib/server/membership';

export const dynamic = 'force-dynamic';

/** Price preview using the caller's VERIFIED membership (retail when signed out). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = await getRequestUser(request);
    const membership = user ? await getVerifiedMembership(user.id) : null;
    const q = buildMediaQuote(body.service, body.addons, membership?.tier || null);
    return NextResponse.json({
      lines: q.lines,
      retailCents: q.retailCents,
      discountPercent: q.discountPercent,
      discountCents: q.discountCents,
      totalCents: q.totalCents,
      visits: q.visits,
      membership: membership?.tier || null,
    });
  } catch (err: any) {
    if (err instanceof MediaQuoteError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('[media/quote]', err);
    return NextResponse.json({ error: 'Could not price this order.' }, { status: 500 });
  }
}
