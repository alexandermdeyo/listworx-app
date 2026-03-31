import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type AppRole = 'ADMIN' | 'CONTRACTOR' | 'USER' | null;

function getDefaultRoute(role: AppRole) {
  if (role === 'ADMIN') return '/admin/crm';
  if (role === 'CONTRACTOR') return '/contractor-dashboard';
  return '/requestor-dashboard';
}

function isRequestorRole(role: AppRole) {
  return role === 'USER';
}

function sanitizeRedirect(redirect: string | null, role: AppRole) {
  const fallback = getDefaultRoute(role);

  if (!redirect || typeof redirect !== 'string') {
    return fallback;
  }

  const trimmed = redirect.trim();

  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/login') ||
    trimmed.startsWith('/signup') ||
    trimmed.startsWith('/logout')
  ) {
    return fallback;
  }

  if (role === 'ADMIN') {
    return trimmed.startsWith('/admin') ? trimmed : fallback;
  }

  if (role === 'CONTRACTOR') {
    if (
      trimmed.startsWith('/contractor-dashboard') ||
      trimmed.startsWith('/billing') ||
      trimmed.startsWith('/apply') ||
      trimmed.startsWith('/set-password')
    ) {
      return trimmed;
    }
    return fallback;
  }

  if (role === 'USER') {
    if (
      trimmed.startsWith('/requestor-dashboard') ||
      trimmed.startsWith('/request')
    ) {
      return trimmed;
    }
    return fallback;
  }

  return fallback;
}

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
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
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          req.cookies.set({ name, value: '', ...options });
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole = null;

  if (user) {
    const { data: appUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    role = (appUser?.role as AppRole) || null;
  }

  const pathname = req.nextUrl.pathname;
  const redirectParam = req.nextUrl.searchParams.get('redirect');
  const isRequestor = isRequestorRole(role);

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/contractor-dashboard') ||
    pathname.startsWith('/requestor-dashboard') ||
    pathname.startsWith('/billing')
  ) {
    res.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }

  if ((pathname === '/login' || pathname === '/signup') && user) {
    const target = sanitizeRedirect(redirectParam, role);
    return NextResponse.redirect(new URL(target, req.url));
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/contractor-dashboard')) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', '/contractor-dashboard');
      return NextResponse.redirect(url);
    }

    if (role !== 'CONTRACTOR') {
      if (isRequestor) {
        return NextResponse.redirect(new URL('/requestor-dashboard', req.url));
      }
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/requestor-dashboard')) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', '/requestor-dashboard');
      return NextResponse.redirect(url);
    }

    if (!isRequestor) {
      if (role === 'CONTRACTOR') {
        return NextResponse.redirect(new URL('/contractor-dashboard', req.url));
      }
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  if (pathname.startsWith('/billing')) {
    if (!user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (role !== 'CONTRACTOR') {
      if (isRequestor) {
        return NextResponse.redirect(new URL('/requestor-dashboard', req.url));
      }
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/crm', req.url));
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
