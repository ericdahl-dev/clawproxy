import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { formatRelativeTime, formatTimestamp } from '@/app/lib/dashboard/datetime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('uses default absent label', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  test('uses custom absent label', () => {
    expect(formatRelativeTime(null, { absentLabel: 'Never' })).toBe('Never');
  });

  test('formats past intervals', () => {
    const t = new Date('2025-06-15T11:59:30.000Z');
    expect(formatRelativeTime(t)).toBe('Just now');

    const t2 = new Date('2025-06-15T11:30:00.000Z');
    expect(formatRelativeTime(t2)).toBe('30m ago');

    const t3 = new Date('2025-06-15T06:00:00.000Z');
    expect(formatRelativeTime(t3)).toBe('6h ago');

    const t4 = new Date('2025-06-10T12:00:00.000Z');
    expect(formatRelativeTime(t4)).toBe('5d ago');
  });

  test('formats future intervals', () => {
    const t = new Date('2025-06-15T12:00:30.000Z');
    expect(formatRelativeTime(t)).toBe('In <1m');

    const t2 = new Date('2025-06-15T12:45:00.000Z');
    expect(formatRelativeTime(t2)).toBe('In 45m');

    const t3 = new Date('2025-06-15T18:00:00.000Z');
    expect(formatRelativeTime(t3)).toBe('In 6h');

    const t4 = new Date('2025-06-17T12:00:00.000Z');
    expect(formatRelativeTime(t4)).toBe('In 2d');
  });
});

describe('formatTimestamp', () => {
  test('returns em dash for null', () => {
    expect(formatTimestamp(null)).toBe('—');
  });

  test('returns locale string for dates', () => {
    const d = new Date('2025-03-01T15:30:00.000Z');
    expect(formatTimestamp(d)).toBe(d.toLocaleString());
  });
});
