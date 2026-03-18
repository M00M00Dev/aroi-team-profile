import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // Fixed: Changed 'next/request' to 'next/server'

/**
 * AROI MIDDLEWARE - STAGE 3
 * Purpose: Protects all private routes and handles redirection 
 * based on the 'aroi_session' cookie.
 */

export function middleware(request: NextRequest) {
  // 1. Extract the session cookie
  const session = request.cookies.get('aroi_session');
  
  // 2. Determine current location
  const { pathname } = request.nextUrl;

  // 3. Define Public paths
  const isPublicPath = pathname === '/login';
  
  // 4. Protection Logic
  // CASE A: User is NOT logged in and trying to access a PRIVATE page
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // CASE B: User IS logged in and trying to go to the LOGIN page
  if (session && isPublicPath) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // CASE C: Proceed as normal
  return NextResponse.next();
}

/**
 * CONFIGURATION - MATCHER
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/staff
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    '/((?!api/staff|_next/static|_next/image|favicon.ico|public).*)',
  ],
};