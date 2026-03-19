import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@psyscale/shared-types';

/**
 * Middleware PsyLib — Auth guard + redirects
 *
 * Routes :
 * - / (public)
 * - /login → redirect si déjà authentifié
 * - /(dashboard)/* → redirect vers /login si non authentifié
 * - /(patient-portal)/* → redirect vers /login si non authentifié
 * - /onboarding/* → redirect vers /dashboard si is_onboarded = true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const middleware = auth((req: NextRequest & { auth?: { user?: { role: UserRole }; expires: string } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.user;

  // Routes publiques — toujours accessibles
  if (pathname === '/' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // /login — redirect vers dashboard si déjà authentifié
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated) {
      const role = session?.user?.role;
      if (role === UserRole.PATIENT) {
        return NextResponse.redirect(new URL('/patient-portal', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Routes protégées — redirect vers /login si non authentifié
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/patient-portal') ||
    pathname.startsWith('/onboarding')
  ) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protection RBAC — dashboard uniquement pour psychologist/admin
  if (pathname.startsWith('/dashboard')) {
    const role = session?.user?.role;
    if (role === UserRole.PATIENT) {
      return NextResponse.redirect(new URL('/patient-portal', req.url));
    }
  }

  // Protection RBAC — patient-portal uniquement pour patients
  if (pathname.startsWith('/patient-portal')) {
    const role = session?.user?.role;
    if (role === UserRole.PSYCHOLOGIST || role === UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as unknown as import('next/server').NextMiddleware;

export default middleware;

export const config = {
  matcher: [
    /*
     * Exclut :
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Fichiers avec extensions (images, fonts...)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
