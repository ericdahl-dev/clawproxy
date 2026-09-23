import { NextResponse } from 'next/server';

import { signInWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
const SIGN_IN_MAX_FAILED_ATTEMPTS = 5;
const SIGN_IN_RETRY_AFTER_SECONDS = SIGN_IN_WINDOW_MS / 1000;

type SignInAttempt = {
  failedCount: number;
  windowStart: number;
};

const signInAttempts = new Map<string, SignInAttempt>();

function signInKey(request: Request, email: string) {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
  return `${ip}:${email.trim().toLowerCase()}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = signInAttempts.get(key);
  if (!entry) return false;

  if (now - entry.windowStart >= SIGN_IN_WINDOW_MS) {
    signInAttempts.delete(key);
    return false;
  }

  return entry.failedCount >= SIGN_IN_MAX_FAILED_ATTEMPTS;
}

function recordFailedSignIn(key: string) {
  const now = Date.now();
  const entry = signInAttempts.get(key);
  if (!entry || now - entry.windowStart >= SIGN_IN_WINDOW_MS) {
    signInAttempts.set(key, { failedCount: 1, windowStart: now });
    return;
  }
  entry.failedCount += 1;
}

function clearFailedSignIns(key: string) {
  signInAttempts.delete(key);
}

function tooManyAttemptsResponse() {
  return NextResponse.json(
    { ok: false, error: 'Too many sign-in attempts' },
    {
      status: 429,
      headers: { 'retry-after': String(SIGN_IN_RETRY_AFTER_SECONDS) },
    }
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const email = stringField(body, 'email');
  const key = signInKey(request, email);

  if (isRateLimited(key)) {
    return tooManyAttemptsResponse();
  }

  const result = await signInWithPassword(email, stringField(body, 'password'));

  if (!result.ok) {
    recordFailedSignIn(key);
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 401 });
  }

  clearFailedSignIns(key);
  return okWithSession({ user: result.user }, result.token, result.expiresAt);
}
