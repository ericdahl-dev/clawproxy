import { describe, expect, test } from 'vitest';

import {
  extractBearerToken,
  generateNodeToken,
  hashNodeToken,
} from '@/app/lib/auth/node-tokens';

describe('node token helpers', () => {
  test('generateNodeToken returns a prefixed token and matching hash', () => {
    const result = generateNodeToken();

    expect(result.token.startsWith('cpn_')).toBe(true);
    expect(result.tokenHash).toBe(hashNodeToken(result.token));
  });

  test('extractBearerToken returns token for valid bearer header', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
  });

  test('extractBearerToken rejects missing or malformed headers', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken('Basic abc123')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
  });
});
