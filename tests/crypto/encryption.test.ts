import { describe, expect, test } from 'vitest';

import { decrypt, encrypt } from '@/app/lib/crypto/encryption';

describe('encrypt / decrypt', () => {
  test('round-trips a plain string', () => {
    const plaintext = 'hello, world!';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  test('round-trips an empty string', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  test('round-trips a JSON object string', () => {
    const json = JSON.stringify({ 'content-type': 'application/json', authorization: 'Bearer tok' });
    expect(decrypt(encrypt(json))).toBe(json);
  });

  test('round-trips a multi-line body', () => {
    const body = 'line1\nline2\nline3';
    expect(decrypt(encrypt(body))).toBe(body);
  });

  test('round-trips unicode content', () => {
    const text = '日本語テスト 🎉';
    expect(decrypt(encrypt(text))).toBe(text);
  });

  test('produces different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'same input';
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  test('encrypted output begins with the version prefix "v1:"', () => {
    expect(encrypt('test')).toMatch(/^v1:/);
  });

  test('encrypted output has exactly 4 colon-separated segments', () => {
    const parts = encrypt('test').split(':');
    expect(parts).toHaveLength(4);
  });

  test('throws on tampered ciphertext', () => {
    const encrypted = encrypt('sensitive data');
    const tampered = encrypted.slice(0, -4) + 'XXXX';
    expect(() => decrypt(tampered)).toThrow();
  });

  test('throws on invalid format (wrong segment count)', () => {
    expect(() => decrypt('not:a:valid')).toThrow(/invalid encrypted value format/i);
  });

  test('throws on wrong version prefix', () => {
    const parts = encrypt('x').split(':');
    parts[0] = 'v0';
    expect(() => decrypt(parts.join(':'))).toThrow(/invalid encrypted value format/i);
  });
});

describe('encrypt', () => {
  test('throws when ENCRYPTION_KEY is missing', () => {
    const original = process.env['ENCRYPTION_KEY'];
    delete process.env['ENCRYPTION_KEY'];
    try {
      expect(() => encrypt('x')).toThrow('ENCRYPTION_KEY is not set');
    } finally {
      process.env['ENCRYPTION_KEY'] = original;
    }
  });

  test('throws when ENCRYPTION_KEY has wrong length', () => {
    const original = process.env['ENCRYPTION_KEY'];
    process.env['ENCRYPTION_KEY'] = 'tooshort';
    try {
      expect(() => encrypt('x')).toThrow('64-character hex string');
    } finally {
      process.env['ENCRYPTION_KEY'] = original;
    }
  });

  test('throws when ENCRYPTION_KEY contains non-hex characters', () => {
    const original = process.env['ENCRYPTION_KEY'];
    process.env['ENCRYPTION_KEY'] = 'z'.repeat(64);
    try {
      expect(() => encrypt('x')).toThrow('64-character hex string');
    } finally {
      process.env['ENCRYPTION_KEY'] = original;
    }
  });
});
