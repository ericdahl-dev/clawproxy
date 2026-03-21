'use client';

function randomUuidFallback() {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function ensureCryptoRandomUuid() {
  const globalCrypto = globalThis.crypto as Crypto | undefined;

  if (!globalCrypto) {
    return;
  }

  if (typeof globalCrypto.randomUUID !== 'function') {
    Object.defineProperty(globalCrypto, 'randomUUID', {
      value: randomUuidFallback,
      configurable: true,
    });
  }
}

export async function createNeonClientAuth() {
  ensureCryptoRandomUuid();

  const { createAuthClient } = await import('@neondatabase/auth');
  return createAuthClient('/api/auth');
}
