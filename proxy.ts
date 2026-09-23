import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/app/lib/auth/constants';

/**
 * Keep middleware edge-safe: only require that a session cookie exists before dashboard
 * navigation. The dashboard layout validates the session against Postgres at runtime.
 */
export default function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) return NextResponse.next();

  const loginUrl = new URL('/auth/sign-in', request.url);
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next !== '/dashboard') loginUrl.searchParams.set('next', next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
