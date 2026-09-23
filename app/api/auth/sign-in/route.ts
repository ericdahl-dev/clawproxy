import { NextResponse } from 'next/server';

import { signInWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await signInWithPassword(stringField(body, 'email'), stringField(body, 'password'));

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 401 });
  }

  return okWithSession({ user: result.user }, result.token, result.expiresAt);
}
