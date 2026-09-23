import { describe, expect, test } from 'vitest';

import { hashPassword, verifyPassword } from '@/app/lib/auth/password';

describe('password hashing', () => {
  test('hashes and verifies a password without storing the plain text', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  test('rejects malformed password hashes', async () => {
    await expect(verifyPassword('anything', 'not-a-real-hash')).resolves.toBe(false);
  });
});
