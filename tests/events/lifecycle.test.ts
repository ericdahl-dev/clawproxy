import { describe, expect, test } from 'vitest';

import {
  canRetry,
  isEventTTLExpired,
  isLeaseExpired,
} from '@/app/lib/events/lifecycle';
import { DEFAULT_MAX_RETRY_ATTEMPTS } from '@/app/lib/events/leases';

describe('isLeaseExpired', () => {
  test('returns false when leaseExpiresAt is null', () => {
    expect(isLeaseExpired(null)).toBe(false);
  });

  test('returns false when lease is in the future', () => {
    const now = new Date('2026-03-22T00:00:00.000Z');
    const future = new Date('2026-03-22T00:01:00.000Z');
    expect(isLeaseExpired(future, now)).toBe(false);
  });

  test('returns true when lease is in the past', () => {
    const now = new Date('2026-03-22T00:01:00.000Z');
    const past = new Date('2026-03-22T00:00:00.000Z');
    expect(isLeaseExpired(past, now)).toBe(true);
  });

  test('returns true when lease equals now (boundary)', () => {
    const now = new Date('2026-03-22T00:00:00.000Z');
    expect(isLeaseExpired(now, now)).toBe(true);
  });
});

describe('isEventTTLExpired', () => {
  test('returns false when expiry is in the future', () => {
    const now = new Date('2026-03-22T00:00:00.000Z');
    const future = new Date('2026-03-23T00:00:00.000Z');
    expect(isEventTTLExpired(future, now)).toBe(false);
  });

  test('returns true when expiry is in the past', () => {
    const now = new Date('2026-03-22T12:00:00.000Z');
    const past = new Date('2026-03-22T00:00:00.000Z');
    expect(isEventTTLExpired(past, now)).toBe(true);
  });

  test('returns true when expiry equals now (boundary)', () => {
    const now = new Date('2026-03-22T00:00:00.000Z');
    expect(isEventTTLExpired(now, now)).toBe(true);
  });
});

describe('canRetry', () => {
  test('returns true when attemptCount is below default max', () => {
    expect(canRetry(0)).toBe(true);
    expect(canRetry(DEFAULT_MAX_RETRY_ATTEMPTS - 1)).toBe(true);
  });

  test('returns false when attemptCount equals or exceeds default max', () => {
    expect(canRetry(DEFAULT_MAX_RETRY_ATTEMPTS)).toBe(false);
    expect(canRetry(DEFAULT_MAX_RETRY_ATTEMPTS + 1)).toBe(false);
  });

  test('respects a custom maxAttempts override', () => {
    expect(canRetry(2, 3)).toBe(true);
    expect(canRetry(3, 3)).toBe(false);
    expect(canRetry(10, 3)).toBe(false);
  });
});
