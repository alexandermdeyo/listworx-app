import { NextRequest, NextResponse } from 'next/server';
import { getResource } from '@/lib/learning/resources';
import { getRequestUser } from '@/lib/server/require-admin';
import { getVerifiedMembership } from '@/lib/server/membership';
import { hasPaidResources } from '@/lib/membership/benefits';

export const dynamic = 'force-dynamic';

/** Serves a Learning Center resource. Paid resources need a verified Growth or Business Pro membership. */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const resource = getResource(params.slug);
  if (!resource) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (resource.access === 'growth') {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Sign in to view this resource.', locked: true }, { status: 401 });
    const m = await getVerifiedMembership(user.id);
    if (!hasPaidResources(m.tier)) return NextResponse.json({ error: 'Included with Growth and Business Pro.', locked: true }, { status: 403 });
  }
  return NextResponse.json({ resource });
}
