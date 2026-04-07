import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type Role =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER'
  | null;

function isRequestor(role: Role) {
  return (
    role === 'REALTOR' ||
    role === 'HOMEOWNER' ||
    role === 'PROPERTY_MANAGER'
  );
}

function normalizeRole(role?: string | null): Role {
  const normalized = (role || '').toUpperCase();

  if (
    normalized === 'ADMIN' ||
    normalized === 'CONTRACTOR' ||
    normalized === 'REALTOR' ||
    normalized === 'HOMEOWNER' ||
    normalized === 'PROPERTY_MANAGER'
  ) {
    return normalized as Role;
  }

  return null;
}

function normalizeStatus(status?: string | null) {
  return (status || '').toString().trim().toLowerCase();
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const protectedRoutes = [
    '/admin',
    '/contractor-dashboard',
    '/requestor-dashboard',
    '/billing',
  ];

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set() {
        // no-op in middleware
      },
      remove() {
        // no-op in middleware
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role = null;
  let contractorStatus = '';
  let hasContractorProfile = false;

  if (user?.id) {
    const [{ data: appUser }, { data: contractorProfile }] = await Promise.all([
      supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
      supabase
        .from('contractor_profiles')
        .select('partner_status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    role = normalizeRole(appUser?.role);
    contractorStatus = normalizeStatus(contractorProfile?.partner_status);
    hasContractorProfile = !!contractorProfile;
  }

  const isContractor = role === 'CONTRACTOR' || hasContractorProfile;

  if (isProtected && !user) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/admin')) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (path.startsWith('/requestor-dashboard')) {
    if (!isRequestor(role)) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      if (isContractor) {
        return NextResponse.redirect(new URL('/contractor-dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (path.startsWith('/contractor-dashboard')) {
    if (!isContractor) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      if (isRequestor(role)) {
        return NextResponse.redirect(new URL('/requestor-dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (path.startsWith('/billing')) {
    if (!isContractor) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      if (isRequestor(role)) {
        return NextResponse.redirect(new URL('/requestor-dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (
      contractorStatus !== 'approved' &&
      contractorStatus !== 'active'
    ) {
      return NextResponse.redirect(new URL('/contractor-dashboard', req.url));
    }
  }

  if (isProtected) {
    res.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0'
    );
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};