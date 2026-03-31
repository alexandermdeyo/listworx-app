import { createClient } from '@/lib/supabase-browser';

export type AdminAuthResult =
  | { ok: true; user: { id: string; email?: string }; profile: { role: string } }
  | { ok: false; reason: 'no_user' | 'not_admin' | 'error' };

export async function checkAdminAuth(): Promise<AdminAuthResult> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, reason: 'no_user' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { ok: false, reason: 'error' };
    }

    if (!profile || profile.role !== 'ADMIN') {
      return { ok: false, reason: 'not_admin' };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
    };
  } catch {
    return { ok: false, reason: 'error' };
  }
}