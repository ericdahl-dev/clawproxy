import { NextResponse } from 'next/server';

import { signUpWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

export async function POST(request: Request) {
  const body = await readJson(request);
  const result = await signUpWithPassword({
    email: stringField(body, 'email'),
    password: stringField(body, 'password'),
    name: stringField(body, 'name'),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 });
  }

  return okWithSession({ user: result.user }, result.token, result.expiresAt);
}
