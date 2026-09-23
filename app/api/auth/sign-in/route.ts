import { NextResponse } from 'next/server';

import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  recordAuthRateLimitAttempt,
} from '@/app/lib/auth/rate-limit';
import { signInWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
const SIGN_IN_MAX_FAILED_ATTEMPTS = 5;
const SIGN_IN_KIND = 'sign-in';

function signInKey(email: string) {
  return `${SIGN_IN_KIND}:${email.trim().toLowerCase()}`;
}

function tooManyAttemptsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, error: 'Too many sign-in attempts' },
    {
      status: 429,
      headers: { 'retry-after': String(retryAfterSeconds) },
    }
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = stringField(body, 'email');
  const key = signInKey(email);

  const rateLimit = await checkAuthRateLimit({
    key,
    kind: SIGN_IN_KIND,
    maxAttempts: SIGN_IN_MAX_FAILED_ATTEMPTS,
    windowMs: SIGN_IN_WINDOW_MS,
  });
  if (rateLimit.limited) {
    return tooManyAttemptsResponse(rateLimit.retryAfterSeconds);
  }

  const result = await signInWithPassword(email, stringField(body, 'password'));

  if (!result.ok) {
    await recordAuthRateLimitAttempt({ key, kind: SIGN_IN_KIND, windowMs: SIGN_IN_WINDOW_MS });
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 401 });
  }

  await clearAuthRateLimit(key);
  return okWithSession({ user: result.user }, result.token, result.expiresAt);
}
