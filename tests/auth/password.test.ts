import { describe, expect, test } from 'vitest';

import { hashPassword, passwordHashNeedsUpgrade, verifyPassword } from '@/app/lib/auth/password';

describe('password hashing', () => {
  test('hashes and verifies a password without storing the plain text', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^scrypt\$131072\$8\$1\$/);
    expect(hash).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  test('detects hashes generated with weaker legacy scrypt parameters', async () => {
    const legacyHash = 'scrypt$16384$8$1$salt$derivedkey';
    const currentHash = await hashPassword('correct horse battery staple');

    expect(passwordHashNeedsUpgrade(legacyHash)).toBe(true);
    expect(passwordHashNeedsUpgrade(currentHash)).toBe(false);
  });

  test('rejects malformed password hashes', async () => {
    await expect(verifyPassword('anything', 'not-a-real-hash')).resolves.toBe(false);
  });
});
