import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from './supabase-admin';

export type CallerClassification = 'anonymous' | 'non_admin' | 'admin';

/**
 * Pure classifier: given whether a session user was found and whether that
 * user has the ADMIN role, decide which bucket the caller falls into.
 * Kept separate from any I/O so it can be unit tested without a live session
 * or database.
 */
export function classifyCaller(hasUser: boolean, isAdmin: boolean): CallerClassification {
  if (!hasUser) return 'anonymous';
  return isAdmin ? 'admin' : 'non_admin';
}

/**
 * Looks up whether the given user id has role = 'ADMIN' in the users table.
 * Isolated from session/cookie handling so it can be unit tested with a
 * fake Supabase-like client.
 */
export async function isRoleAdmin(
  supabaseAdmin: { from: (table: string) => any },
  userId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return String(data?.role || '').toUpperCase() === 'ADMIN';
}

/**
 * Resolves the authenticated caller for the current request (via Next.js
 * cookies) and classifies them as anonymous / non_admin / admin.
 *
 * This is the same pattern already used by
 * app/api/admin/contractor-status/route.ts, extracted so other
 * admin-only routes (e.g. approve-application) can share it instead of
 * going unchecked.
 */
export async function requireAdminCaller(): Promise<{
  userId: string;
  classification: CallerClassification;
} | null> {
  const supabaseAdmin = createSupabaseAdminClient();
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = await isRoleAdmin(supabaseAdmin, user.id);
  const classification = classifyCaller(true, admin);

  return { userId: user.id, classification };
}
