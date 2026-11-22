import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/server/require-admin';
import { getVerifiedMembership } from '@/lib/server/membership';
import { hasFlyerBuilder, hasPaidResources, socialPostAllowance } from '@/lib/membership/benefits';

export const dynamic = 'force-dynamic';

/** The caller's verified current membership and what it unlocks. */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ tier: null, signedIn: false });
  const m = await getVerifiedMembership(user.id);
  return NextResponse.json({
    signedIn: true,
    tier: m.tier,
    isContractor: Boolean(m.contractorId),
    paidResources: hasPaidResources(m.tier),
    flyerBuilder: hasFlyerBuilder(m.tier),
    socialPostsPerMonth: socialPostAllowance(m.tier),
  });
}
