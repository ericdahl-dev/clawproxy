import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('createClientAuth', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({ ok: true, data: { user: { id: 'user-1' } } })
    ) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  test('posts sign-in credentials to the first-party auth endpoint', async () => {
    const { createClientAuth } = await import('@/app/lib/auth/client');
    const auth = await createClientAuth();

    const result = await auth.signIn.email({ email: 'user@example.com', password: 'secret' });

    expect(result).toEqual({ data: { user: { id: 'user-1' } } });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
    });
  });

  test('maps API failures to the auth-client error shape used by forms', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({ ok: false, error: 'Invalid email or password' }, { status: 401 })
    ) as typeof fetch;

    const { createClientAuth } = await import('@/app/lib/auth/client');
    const auth = await createClientAuth();

    await expect(auth.signIn.email({ email: 'user@example.com', password: 'bad' })).resolves.toEqual({
      error: { message: 'Invalid email or password' },
    });
  });

  test('posts sign-out to the first-party endpoint', async () => {
    const { createClientAuth } = await import('@/app/lib/auth/client');
    const auth = await createClientAuth();

    await auth.signOut();

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
  });
});
