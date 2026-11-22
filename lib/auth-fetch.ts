'use client';

import { createClient } from '@/lib/supabase-browser';

let client: ReturnType<typeof createClient> | null = null;

/** fetch() that adds the signed-in user's access token, if any. */
export async function authFetch(input: string, init: RequestInit = {}) {
  client = client || createClient();
  const { data } = await client.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

export async function getSignedInEmail(): Promise<string | null> {
  client = client || createClient();
  const { data } = await client.auth.getSession();
  return data.session?.user?.email || null;
}
