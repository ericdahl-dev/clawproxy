import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 } as const;

function scrypt(password: string, salt: string, keyLength: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS)) as Buffer;
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt,
    derivedKey.toString('base64url'),
  ].join('$');
}

export function passwordHashNeedsUpgrade(storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return true;

  const [, nRaw, rRaw, pRaw] = parts;
  return (
    Number(nRaw) < SCRYPT_PARAMS.N ||
    Number(rRaw) !== SCRYPT_PARAMS.r ||
    Number(pRaw) !== SCRYPT_PARAMS.p
  );
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, salt, expectedRaw] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || !salt || !expectedRaw) {
    return false;
  }

  try {
    const expected = Buffer.from(expectedRaw, 'base64url');
    const actual = (await scrypt(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: Math.max(SCRYPT_PARAMS.maxmem, 128 * N * r + 1024 * 1024),
    })) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
