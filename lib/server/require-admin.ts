import type { NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

/** Returns the admin user id if the request carries a valid ADMIN session token, else null. */
export async function requireAdminRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle();
  return profile?.role === 'ADMIN' ? data.user.id : null;
}
