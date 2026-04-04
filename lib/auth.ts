import { createClient } from './supabase-browser';

function getClient() {
  return createClient();
}

export type AppUserRole =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER'
  | null;

export async function signInWithEmail(email: string, password: string) {
  const supabase = getClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = getClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const supabase = getClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getCurrentSession() {
  const supabase = getClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export async function getUserRole(userId: string): Promise<AppUserRole> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  const normalized = String(data.role).toUpperCase();

  if (
    normalized === 'ADMIN' ||
    normalized === 'CONTRACTOR' ||
    normalized === 'REALTOR' ||
    normalized === 'HOMEOWNER' ||
    normalized === 'PROPERTY_MANAGER'
  ) {
    return normalized as AppUserRole;
  }

  return null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const role = await getUserRole(user.id);
  return role === 'ADMIN';
}

export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: { id: string; role?: string; name?: string; email?: string } | null;
}> {
  const supabase = getClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { isAdmin: false, user: null };
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('id, role, name, email')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !userData) {
    return { isAdmin: false, user: null };
  }

  return {
    isAdmin: String(userData.role).toUpperCase() === 'ADMIN',
    user: userData,
  };
}