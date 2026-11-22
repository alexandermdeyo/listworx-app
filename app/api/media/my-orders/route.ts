import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/server/require-admin';

export const dynamic = 'force-dynamic';

/** Signed-in customer's own media orders (no admin-only fields). */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: 'Sign in to see your orders.' }, { status: 401 });
  const { data, error } = await createSupabaseAdminClient()
    .from('media_orders')
    .select('id, order_number, line_items, total_cents, discount_cents, discount_percent, payment_status, fulfillment_status, project_address, deliverables_url, created_at, media_appointments(visit_number, status, starts_at, ends_at)')
    .eq('customer_user_id', user.id)
    .neq('payment_status', 'expired')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 });
  const orders = (data || []).map((o: any) => ({
    ...o,
    media_appointments: (o.media_appointments || []).filter((a: any) => ['requested', 'proposed', 'confirmed', 'completed', 'hold'].includes(a.status)),
  }));
  return NextResponse.json({ orders });
}
