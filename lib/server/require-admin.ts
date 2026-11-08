import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export type RequestUser = { id: string; email: string | null };

/**
 * The signed-in user making this request, from either an
 * `Authorization: Bearer <token>` header or the Supabase session cookies.
 */
export async function getRequestUser(request: NextRequest): Promise<RequestUser | null> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token) {
    const { data, error } = await createSupabaseAdminClient().auth.getUser(token);
    if (!error && data.user) return { id: data.user.id, email: data.user.email?.toLowerCase() || null };
  }
  try {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set() {},
        remove() {},
      },
    });
    const { data } = await supabase.auth.getUser();
    if (data.user) return { id: data.user.id, email: data.user.email?.toLowerCase() || null };
  } catch {
    /* no cookie session */
  }
  return null;
}

/** Returns the admin user id if the request comes from a signed-in ADMIN, else null. */
export async function requireAdminRequest(request: NextRequest): Promise<string | null> {
  const user = await getRequestUser(request);
  if (!user) return null;
  const { data: profile } = await createSupabaseAdminClient().from('users').select('role').eq('id', user.id).maybeSingle();
  return profile?.role === 'ADMIN' ? user.id : null;
}
