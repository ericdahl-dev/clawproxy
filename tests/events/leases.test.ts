import { describe, expect, test } from 'vitest';

import {
  clampMaxPullEvents,
  DEFAULT_MAX_PULL_EVENTS,
  MAX_PULL_EVENTS,
} from '@/app/lib/events/leases';

describe('event lease helpers', () => {
  test('uses default max when input is not a finite number', () => {
    expect(clampMaxPullEvents(undefined)).toBe(DEFAULT_MAX_PULL_EVENTS);
    expect(clampMaxPullEvents(Number.NaN)).toBe(DEFAULT_MAX_PULL_EVENTS);
    expect(clampMaxPullEvents('10')).toBe(DEFAULT_MAX_PULL_EVENTS);
  });

  test('clamps to minimum of 1', () => {
    expect(clampMaxPullEvents(0)).toBe(1);
    expect(clampMaxPullEvents(-5)).toBe(1);
  });

  test('clamps to configured maximum', () => {
    expect(clampMaxPullEvents(MAX_PULL_EVENTS + 1)).toBe(MAX_PULL_EVENTS);
    expect(clampMaxPullEvents(1000)).toBe(MAX_PULL_EVENTS);
  });

  test('floors valid finite values inside range', () => {
    expect(clampMaxPullEvents(3.9)).toBe(3);
    expect(clampMaxPullEvents(25)).toBe(25);
  });
});
