import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/app/lib/auth/constants';

export type JsonBody = Record<string, unknown>;

export async function readJson(request: Request): Promise<JsonBody | null> {
  try {
    const body = await request.json();
    return typeof body === 'object' && body !== null ? (body as JsonBody) : null;
  } catch {
    return null;
  }
}

export function stringField(body: JsonBody | null, key: string) {
  const value = body?.[key];
  return typeof value === 'string' ? value : '';
}

export function okWithSession(data: unknown, token: string, expiresAt: Date) {
  const response = NextResponse.json({ ok: true, data });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
  return response;
}

export function clearSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
