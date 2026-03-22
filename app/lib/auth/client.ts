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

function getAuthBaseUrl() {
  if (typeof window === 'undefined') {
    const publicBaseUrl = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;

    if (publicBaseUrl) {
      return publicBaseUrl;
    }

    throw new Error('Neon Auth base URL is unavailable on the server');
  }

  return new URL('/api/auth', window.location.origin).toString();
}

export async function createNeonClientAuth() {
  ensureCryptoRandomUuid();

  const { createAuthClient } = await import('@neondatabase/auth');
  return createAuthClient(getAuthBaseUrl());
}
