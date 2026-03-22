import { describe, expect, test } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  test('joins multiple class strings', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  test('filters out falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz');
  });

  test('deduplicates conflicting tailwind utility classes', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  test('returns an empty string when no classes are provided', () => {
    expect(cn()).toBe('');
  });
});
