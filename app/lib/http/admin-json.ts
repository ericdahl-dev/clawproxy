import 'server-only';

import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';

export function jsonOk(body: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...body }, { status: init?.status ?? 200, ...init });
}

export function jsonError(message: string, status: number, init?: ResponseInit) {
  return NextResponse.json({ ok: false, error: message }, { status, ...init });
}

export async function withAdminUser(
  fn: (user: Awaited<ReturnType<typeof requireAdminUser>>) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const user = await requireAdminUser();
    return await fn(user);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return jsonError('Unauthorized', 401);
    }
    console.error('[withAdminUser]', e);
    return jsonError('Something went wrong. Please try again.', 500);
  }
}
