import { auth } from '@/app/lib/auth/server';

/**
 * Match dashboard navigations only — not /api/admin. For POST/DELETE to admin APIs,
 * Neon Auth's middleware forwards the incoming method/body to upstream get-session when
 * the fast cookie-cache path does not apply (GET-only), which breaks JSON APIs and can
 * yield HTML responses. Admin routes use requireAdminUser() instead.
 */
export default auth.middleware({
  loginUrl: '/auth/sign-in',
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
