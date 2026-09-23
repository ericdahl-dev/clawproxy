import 'server-only';

import { eq, sql } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { authRateLimits } from '@/db/schema';

export type AuthRateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

export type AuthRateLimitOptions = {
  key: string;
  kind: string;
  maxAttempts: number;
  windowMs: number;
};

function nowMs() {
  return Date.now();
}

function retryAfter(windowStart: Date, windowMs: number) {
  return Math.max(1, Math.ceil((windowStart.getTime() + windowMs - nowMs()) / 1000));
}

export async function checkAuthRateLimit({
  key,
  maxAttempts,
  windowMs,
}: AuthRateLimitOptions): Promise<AuthRateLimitResult> {
  const [entry] = await db.select().from(authRateLimits).where(eq(authRateLimits.key, key)).limit(1);
  if (!entry) return { limited: false, retryAfterSeconds: 0 };

  if (nowMs() - entry.windowStart.getTime() >= windowMs) {
    await db.delete(authRateLimits).where(eq(authRateLimits.key, key));
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { limited: true, retryAfterSeconds: retryAfter(entry.windowStart, windowMs) };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export async function recordAuthRateLimitAttempt({
  key,
  kind,
  windowMs,
}: Omit<AuthRateLimitOptions, 'maxAttempts'>) {
  const windowStart = new Date();
  const expiredBefore = new Date(windowStart.getTime() - windowMs);

  await db
    .insert(authRateLimits)
    .values({ key, kind, count: 1, windowStart, updatedAt: windowStart })
    .onConflictDoUpdate({
      target: authRateLimits.key,
      set: {
        kind,
        count: sql<number>`case when ${authRateLimits.windowStart} <= ${expiredBefore} then 1 else ${authRateLimits.count} + 1 end`,
        windowStart: sql<Date>`case when ${authRateLimits.windowStart} <= ${expiredBefore} then ${windowStart} else ${authRateLimits.windowStart} end`,
        updatedAt: windowStart,
      },
    });
}

export async function clearAuthRateLimit(key: string) {
  await db.delete(authRateLimits).where(eq(authRateLimits.key, key));
}
