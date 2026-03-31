import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Flora Middleware
// ---------------------------------------------------------------------------
// • Protects /dashboard, /seller, /admin, /courier routes
// • Redirects unauthenticated visitors → /login
// • Redirects authenticated users away from /login & /register to role home
// • Reads role from the JWT stored in the `flora_access_token` cookie
//   (set by the client after login for SSR compatibility)
// ---------------------------------------------------------------------------

/** Role → home route mapping */
const ROLE_HOME: Record<string, string> = {
  customer: '/dashboard',
  seller: '/seller/dashboard',
  admin: '/admin/dashboard',
  courier: '/courier/deliveries',
};

/** Routes that require authentication (prefix match) */
const PROTECTED_PREFIXES = ['/dashboard', '/seller', '/admin', '/courier', '/cart', '/checkout', '/orders', '/subscriptions', '/wishlist', '/occasions', '/settings'];

/** Auth pages — authenticated users should be redirected away */
const AUTH_PAGES = ['/login', '/register'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal JWT payload decoder (base64url → JSON).
 * Does NOT verify signature — verification is the backend's job.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // base64url → base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number | undefined;
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the access token from httpOnly cookie (set by client-side auth logic)
  const token = request.cookies.get('flora_access_token')?.value;

  let role: string | null = null;
  let isAuthenticated = false;

  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload && !isTokenExpired(payload)) {
      role = (payload.role as string) || null;
      isAuthenticated = true;
    }
  }

  // ------------------------------------------------------------------
  // 1. Protected routes — redirect unauth users to /login
  // ------------------------------------------------------------------
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ------------------------------------------------------------------
  // 2. Role-gate — prevent users from accessing other roles' routes
  // ------------------------------------------------------------------
  if (isAuthenticated && role) {
    // Seller routes require seller role
    if (pathname.startsWith('/seller') && role !== 'seller') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url));
    }
    // Admin routes require admin role
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url));
    }
    // Courier routes require courier role
    if (pathname.startsWith('/courier') && role !== 'courier') {
      return NextResponse.redirect(new URL(ROLE_HOME[role] || '/', request.url));
    }
  }

  // ------------------------------------------------------------------
  // 3. Auth pages — redirect authenticated users to their role home
  // ------------------------------------------------------------------
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isAuthPage && isAuthenticated && role) {
    const homeUrl = ROLE_HOME[role] || '/';
    return NextResponse.redirect(new URL(homeUrl, request.url));
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — only run middleware on relevant paths (skip static assets, API)
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
