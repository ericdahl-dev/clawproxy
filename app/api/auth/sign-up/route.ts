import { NextResponse } from 'next/server';

import { signUpWithPassword } from '@/app/lib/auth/server';
import { okWithSession, readJson, stringField } from '../_shared';

const SIGN_UP_WINDOW_MS = 15 * 60 * 1000;
const SIGN_UP_MAX_ATTEMPTS = 5;
const SIGN_UP_RETRY_AFTER_SECONDS = SIGN_UP_WINDOW_MS / 1000;

type SignUpAttempt = {
  count: number;
  windowStart: number;
};

const signUpAttempts = new Map<string, SignUpAttempt>();

function signUpKey(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
  return ip;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = signUpAttempts.get(key);
  if (!entry) return false;

  if (now - entry.windowStart >= SIGN_UP_WINDOW_MS) {
    signUpAttempts.delete(key);
    return false;
  }

  return entry.count >= SIGN_UP_MAX_ATTEMPTS;
}

function recordSignUpAttempt(key: string) {
  const now = Date.now();
  const entry = signUpAttempts.get(key);
  if (!entry || now - entry.windowStart >= SIGN_UP_WINDOW_MS) {
    signUpAttempts.set(key, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

function tooManyAttemptsResponse() {
  return NextResponse.json(
    { ok: false, error: 'Too many sign-up attempts' },
    {
      status: 429,
      headers: { 'retry-after': String(SIGN_UP_RETRY_AFTER_SECONDS) },
    }
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const key = signUpKey(request);

  if (isRateLimited(key)) {
    return tooManyAttemptsResponse();
  }

  recordSignUpAttempt(key);
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
