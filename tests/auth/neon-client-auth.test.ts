import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const createAuthClientMock = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('@neondatabase/auth', () => ({
  createAuthClient: (...args: unknown[]) => createAuthClientMock(...args),
}));

describe('createNeonClientAuth', () => {
  const originalWindow = globalThis.window;
  const originalPublicUrl = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;

  beforeEach(() => {
    createAuthClientMock.mockClear();
    createAuthClientMock.mockReturnValue({});
    delete process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;
  });

  afterEach(() => {
    vi.resetModules();
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
    if (originalPublicUrl === undefined) {
      delete process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL = originalPublicUrl;
    }
  });

  test('uses NEXT_PUBLIC_NEON_AUTH_BASE_URL on the server', async () => {
    Reflect.deleteProperty(globalThis, 'window');
    process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL = 'https://auth.example/neon';

    const { createNeonClientAuth } = await import('@/app/lib/auth/client');
    await createNeonClientAuth();

    expect(createAuthClientMock).toHaveBeenCalledWith('https://auth.example/neon');
  });

  test('throws when server has no public auth base URL', async () => {
    Reflect.deleteProperty(globalThis, 'window');

    const { createNeonClientAuth } = await import('@/app/lib/auth/client');

    await expect(createNeonClientAuth()).rejects.toThrow(
      'Neon Auth base URL is unavailable on the server',
    );
    expect(createAuthClientMock).not.toHaveBeenCalled();
  });

  test('builds base URL from window.location.origin in the browser', async () => {
    globalThis.window = {
      location: { origin: 'https://app.example' },
    } as Window;

    const { createNeonClientAuth } = await import('@/app/lib/auth/client');
    await createNeonClientAuth();

    expect(createAuthClientMock).toHaveBeenCalledWith('https://app.example/api/auth');
  });
});
