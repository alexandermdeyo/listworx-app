import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';

export const dynamic = 'force-dynamic';

/** ADMIN: media orders with their appointments. Unpaid checkouts are hidden unless asked for. */
export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const includeUnpaid = request.nextUrl.searchParams.get('unpaid') === '1';
  let q = createSupabaseAdminClient()
    .from('media_orders')
    .select('*, media_appointments(id, visit_number, status, starts_at, ends_at, requested_starts_at, confirmed_at)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (!includeUnpaid) q = q.in('payment_status', ['paid', 'refunded', 'partially_refunded']);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}
