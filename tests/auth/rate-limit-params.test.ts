import { beforeEach, describe, expect, test, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/pg-proxy';

/**
 * Regression test for the production sign-in 500:
 *
 *   TypeError: The "string" argument must be of type string or an instance of
 *   Buffer or ArrayBuffer. Received an instance of Date
 *
 * postgres.js cannot serialize a raw `Date` interpolated into a `sql` fragment,
 * so every sign-in/sign-up attempt 500'd before credentials were checked.
 * These tests drive the real rate-limit module through a proxy driver and assert
 * the emitted parameters are all driver-serializable.
 */

const captured: { sql: string; params: unknown[] }[] = [];

const proxyDb = drizzle(async (sqlText, params) => {
  captured.push({ sql: sqlText, params });
  return { rows: [] };
});

vi.mock('@/app/lib/db/client', () => ({ db: proxyDb }));
vi.mock('server-only', () => ({}));

describe('recordAuthRateLimitAttempt', () => {
  beforeEach(() => {
    captured.length = 0;
  });

  test('never passes a raw Date to the driver', async () => {
    const { recordAuthRateLimitAttempt } = await import('@/app/lib/auth/rate-limit');

    await recordAuthRateLimitAttempt({
      key: 'sign-in:user@example.com',
      kind: 'sign-in',
      windowMs: 15 * 60 * 1000,
    });

    expect(captured).toHaveLength(1);
    const offenders = captured[0]!.params.filter((param) => param instanceof Date);
    expect(offenders).toEqual([]);
  });

  test('still emits an atomic single-statement upsert that increments in the database', async () => {
    const { recordAuthRateLimitAttempt } = await import('@/app/lib/auth/rate-limit');

    await recordAuthRateLimitAttempt({
      key: 'sign-in:user@example.com',
      kind: 'sign-in',
      windowMs: 15 * 60 * 1000,
    });

    expect(captured).toHaveLength(1);
    const { sql: text } = captured[0]!;
    expect(text).toMatch(/on conflict/i);
    expect(text).toMatch(/"count"\s*\+\s*1/i);
  });
});
