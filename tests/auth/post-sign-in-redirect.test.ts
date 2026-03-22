import { describe, expect, test } from 'vitest';

import { resolvePostSignInRedirect } from '@/app/lib/auth/post-sign-in-redirect';

describe('resolvePostSignInRedirect', () => {
  test('returns default dashboard path when next is missing', () => {
    expect(resolvePostSignInRedirect(undefined)).toBe('/dashboard');
    expect(resolvePostSignInRedirect(null)).toBe('/dashboard');
    expect(resolvePostSignInRedirect('')).toBe('/dashboard');
  });

  test('accepts safe in-app paths', () => {
    expect(resolvePostSignInRedirect('/dashboard')).toBe('/dashboard');
    expect(resolvePostSignInRedirect('/dashboard/nodes')).toBe('/dashboard/nodes');
    expect(resolvePostSignInRedirect('/dashboard?tab=events')).toBe('/dashboard?tab=events');
  });

  test('rejects external, protocol-relative, and non-path values', () => {
    expect(resolvePostSignInRedirect('https://evil.test')).toBe('/dashboard');
    expect(resolvePostSignInRedirect('//evil.test/path')).toBe('/dashboard');
    expect(resolvePostSignInRedirect('dashboard')).toBe('/dashboard');
    expect(resolvePostSignInRedirect('javascript:alert(1)')).toBe('/dashboard');
  });
});
