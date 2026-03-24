import 'server-only';

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const FORMAT_VERSION = 'v1';

function getEncryptionKey(): Buffer {
  const hex = process.env['ENCRYPTION_KEY']?.trim();
  if (!hex) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${FORMAT_VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const parts = encoded.split(':');
  if (parts.length !== 4 || parts[0] !== FORMAT_VERSION) {
    throw new Error(`Invalid encrypted value format: expected "${FORMAT_VERSION}:iv:tag:ciphertext"`);
  }
  const [, ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
