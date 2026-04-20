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

function getContractorDestination(status: string) {
  if (status === 'active') return '/contractor-dashboard';
  if (status === 'approved') return '/billing';
  return '/apply';
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          });

          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });

          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });

          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });

          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const path = req.nextUrl.pathname;

  const protectedRoutes = [
    '/admin',
    '/contractor-dashboard',
    '/requestor-dashboard',
    '/billing',
  ];

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

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
  const contractorDestination = getContractorDestination(contractorStatus);

  if (user?.id) {
    console.log('[middleware] auth resolution', {
      path,
      userId: user.id,
      role,
      hasContractorProfile,
      contractorStatus: contractorStatus || null,
      contractorDestination,
    });
  }

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

    if (contractorStatus === 'approved') {
      console.log('[middleware] contractor redirect', {
        path,
        reason: 'approved contractor must complete billing before dashboard',
        destination: '/billing',
      });
      return NextResponse.redirect(new URL('/billing', req.url));
    }

    if (contractorStatus !== 'active') {
      console.log('[middleware] contractor redirect', {
        path,
        reason: 'contractor not active for dashboard',
        destination: '/apply',
      });
      return NextResponse.redirect(new URL('/apply', req.url));
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

    if (contractorStatus === 'active') {
      console.log('[middleware] contractor redirect', {
        path,
        reason: 'active contractor should use dashboard',
        destination: '/contractor-dashboard',
      });
      return NextResponse.redirect(new URL('/contractor-dashboard', req.url));
    }

    if (contractorStatus !== 'approved') {
      console.log('[middleware] contractor redirect', {
        path,
        reason: 'contractor must have approved status for billing',
        destination: '/apply',
      });
      return NextResponse.redirect(new URL('/apply', req.url));
    }
  }


  if (path.startsWith('/apply')) {
    if (!user) {
      return NextResponse.redirect(new URL('/contractor-portal', req.url));
    }

    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/crm', req.url));
    }

    if (isRequestor(role)) {
      return NextResponse.redirect(new URL('/requestor-dashboard', req.url));
    }

    if (!isContractor) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (contractorStatus === 'active') {
      return NextResponse.redirect(new URL('/contractor-dashboard', req.url));
    }

    if (contractorStatus === 'approved') {
      return NextResponse.redirect(new URL('/billing', req.url));
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
