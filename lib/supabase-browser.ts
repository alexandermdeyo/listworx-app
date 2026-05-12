import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'build-time-placeholder-key';

function getPublicSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
    throw new Error(
      'Missing Supabase public environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  return {
    supabaseUrl: supabaseUrl || FALLBACK_SUPABASE_URL,
    supabaseAnonKey: supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY,
  };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
