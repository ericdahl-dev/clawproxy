import { afterEach, describe, expect, test, vi } from 'vitest';

const returnedMiddleware = { kind: 'neon-auth-middleware' as const };
const middlewareSpy = vi.hoisted(() => vi.fn(() => returnedMiddleware));

vi.mock('@/app/lib/auth/server', () => ({
  auth: {
    middleware: (config: unknown) => middlewareSpy(config),
  },
}));

describe('proxy (Neon Auth middleware export)', () => {
  afterEach(() => {
    middlewareSpy.mockClear();
  });

  test('configures middleware with dashboard login URL and matcher', async () => {
    vi.resetModules();
    const mod = await import('../proxy');

    expect(middlewareSpy).toHaveBeenCalledWith({ loginUrl: '/auth/sign-in' });
    expect(mod.default).toBe(returnedMiddleware);
    expect(mod.config.matcher).toEqual(['/dashboard/:path*']);
  });
});
