import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://example.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'build-time-placeholder-key';

let cachedSupabaseClient: SupabaseClient<any> | null = null;

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!supabaseUrl || !supabaseAnonKey) && typeof window !== 'undefined') {
    throw new Error(
      'Missing Supabase public environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient<any>(
      supabaseUrl || FALLBACK_SUPABASE_URL,
      supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY
    );
  }

  return cachedSupabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient<any>, {
  get(_target, property) {
    const client = createPublicSupabaseClient();
    const value = client[property as keyof typeof client];

    if (typeof value === 'function') {
      return value.bind(client);
    }

    return value;
  },
});

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase server environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    );
  }

  return createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
