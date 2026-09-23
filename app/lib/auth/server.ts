import 'server-only';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { db } from '@/app/lib/db/client';
import { SESSION_COOKIE_NAME } from './constants';
import { authSessions, authUsers, type AuthUser } from '@/db/schema';
import { hashPassword, verifyPassword } from './password';

const SESSION_DAYS = 30;

export type AppAuthUser = Pick<AuthUser, 'id' | 'email' | 'name'>;

type AuthSuccess = {
  ok: true;
  user: AppAuthUser;
  token: string;
  expiresAt: Date;
};

type AuthFailure = {
  ok: false;
  error: string;
  status?: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicUser(user: AuthUser): AppAuthUser {
  return { id: user.id, email: user.email, name: user.name };
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newSessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

async function createSession(user: AuthUser): Promise<AuthSuccess> {
  const token = createSessionToken();
  const expiresAt = newSessionExpiry();

  await db.insert(authSessions).values({
    id: randomUUID(),
    tokenHash: hashSessionToken(token),
    userId: user.id,
    expiresAt,
  });

  return { ok: true, user: publicUser(user), token, expiresAt };
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthSuccess | AuthFailure> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const name = input.name?.trim() || email;

  if (!email || !email.includes('@')) return { ok: false, error: 'Valid email is required', status: 400 };
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters', status: 400 };
  }

  try {
    const [user] = await db
      .insert(authUsers)
      .values({
        id: randomUUID(),
        email,
        name,
        passwordHash: await hashPassword(password),
      })
      .returning();

    if (!user) return { ok: false, error: 'Could not create account', status: 500 };
    return createSession(user);
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      return { ok: false, error: 'Email already exists', status: 409 };
    }
    throw error;
  }
}

export async function signInWithPassword(
  emailInput: string,
  password: string
): Promise<AuthSuccess | AuthFailure> {
  const email = normalizeEmail(emailInput);
  const [user] = await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: 'Invalid email or password', status: 401 };
  }

  return createSession(user);
}

export async function getSessionByToken(token: string | undefined | null) {
  if (!token) return null;

  const [session] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), gt(authSessions.expiresAt, new Date())))
    .limit(1);

  if (!session) return null;

  const [user] = await db.select().from(authUsers).where(eq(authUsers.id, session.userId)).limit(1);
  if (!user) return null;

  return { user: publicUser(user), session };
}

export async function signOutSession(token: string | undefined | null) {
  if (token) {
    await db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token)));
  }
  return { ok: true };
}

export async function requestPasswordReset(email: string) {
  void email;
  // No email provider is wired yet. Keep the endpoint intentionally neutral so callers cannot
  // enumerate accounts; a future email provider can enqueue a reset token here.
  return { ok: true };
}

export const auth = {
  async getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = await getSessionByToken(token);
    return { data: session ? { user: session.user } : null };
  },
};
