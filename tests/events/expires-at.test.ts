import { describe, expect, test, vi } from 'vitest';

import { getDefaultEventExpiryDate } from '@/app/lib/events/expires-at';

describe('event expiry helper', () => {
  test('returns a date 24 hours after the provided time', () => {
    const start = new Date('2026-03-21T12:00:00.000Z');
    const result = getDefaultEventExpiryDate(start);

    expect(result.toISOString()).toBe('2026-03-22T12:00:00.000Z');
  });

  test('defaults to the current time when no argument is provided', () => {
    const now = new Date('2026-06-01T08:00:00.000Z');
    vi.setSystemTime(now);

    const result = getDefaultEventExpiryDate();

    expect(result.toISOString()).toBe('2026-06-02T08:00:00.000Z');

    vi.useRealTimers();
  });
});
