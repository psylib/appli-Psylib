import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@psyscale/shared-types';
import { buildCspWithNonce, generateNonce, isCspNonceEnabled } from '@/lib/security/csp';

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
// Helper: NextResponse.next() with pathname header for server components.
// Quand CSP_NONCE=true, injecte un nonce par requête + la CSP durcie (nonce+strict-dynamic).
// Next.js lit la CSP des request headers pour propager le nonce à ses propres <script>.
// Flag OFF (défaut) : comportement inchangé, la CSP statique de next.config.mjs s'applique.
function nextWithPathname(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-next-pathname', req.nextUrl.pathname);

  if (!isCspNonceEnabled()) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const nonce = generateNonce();
  const csp = buildCspWithNonce(nonce);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}


const middleware = auth((req: NextRequest & { auth?: { user?: { role: UserRole }; expires: string } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.user;

  // Routes publiques — toujours accessibles
  if (pathname === '/' || pathname.startsWith('/api/auth')) {
    return nextWithPathname(req);
  }

  // /forgot-password, /patient/login, /patient/accept-invitation, guardian pages — toujours accessible
  if (
    pathname === '/forgot-password' ||
    pathname === '/patient/login' ||
    pathname === '/patient/accept-invitation' ||
    pathname.startsWith('/guardian-invite/') ||
    pathname.startsWith('/guardian-consent/')
  ) {
    return nextWithPathname(req);
  }

  // /login — redirect vers dashboard si déjà authentifié
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated) {
      const role = session?.user?.role;
      if (role === UserRole.PATIENT || role === UserRole.GUARDIAN) {
        return NextResponse.redirect(new URL('/patient-portal', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return nextWithPathname(req);
  }

  // Video consultation — patient joins via token (no login required)
  if (pathname.startsWith('/patient-portal/video/')) {
    return nextWithPathname(req);
  }

  // Video invité — rejoint via lien d'invitation public (no login required)
  if (pathname.startsWith('/video/guest/')) {
    return nextWithPathname(req);
  }

  // Routes protégées — redirect vers /login si non authentifié
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/patient-portal') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/video')
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
    if (role === UserRole.PATIENT || role === UserRole.GUARDIAN) {
      return NextResponse.redirect(new URL('/patient-portal', req.url));
    }
  }

  // Protection RBAC — /dashboard/admin/* uniquement pour admin
  if (pathname.startsWith('/dashboard/admin')) {
    const role = session?.user?.role;
    if (role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Protection RBAC — patient-portal pour patients et guardians
  if (pathname.startsWith('/patient-portal')) {
    const role = session?.user?.role;
    if (role !== UserRole.PATIENT && role !== UserRole.GUARDIAN) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return nextWithPathname(req);

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
