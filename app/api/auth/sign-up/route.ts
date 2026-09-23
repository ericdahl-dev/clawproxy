import { NextResponse } from 'next/server';

import {
  checkAuthRateLimit,
  recordAuthRateLimitAttempt,
} from '@/app/lib/auth/rate-limit';
import { signUpWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

const SIGN_UP_WINDOW_MS = 15 * 60 * 1000;
const SIGN_UP_MAX_ATTEMPTS = 5;
const SIGN_UP_KIND = 'sign-up';
const SIGN_UP_GLOBAL_KEY = `${SIGN_UP_KIND}:global`;

function tooManyAttemptsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: 'Too many sign-up attempts' },
    {
      status: 429,
      headers: { 'retry-after': String(retryAfterSeconds) },
    }
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const rateLimit = await checkAuthRateLimit({
    key: SIGN_UP_GLOBAL_KEY,
    kind: SIGN_UP_KIND,
    maxAttempts: SIGN_UP_MAX_ATTEMPTS,
    windowMs: SIGN_UP_WINDOW_MS,
  });
  if (rateLimit.limited) {
    return tooManyAttemptsResponse(rateLimit.retryAfterSeconds);
  }

  await recordAuthRateLimitAttempt({
    key: SIGN_UP_GLOBAL_KEY,
    kind: SIGN_UP_KIND,
    windowMs: SIGN_UP_WINDOW_MS,
  });

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
