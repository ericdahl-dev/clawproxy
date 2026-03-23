import { describe, expect, test, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/auth/server', () => ({
  auth: { getSession: mockGetSession },
}));

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';

describe('requireAdminUser', () => {
  test('throws UnauthorizedError when there is no active session', async () => {
    mockGetSession.mockResolvedValue({ data: null });

    const err = await requireAdminUser().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err).toMatchObject({ name: 'UnauthorizedError', message: 'Unauthorized' });
  });

  test('throws UnauthorizedError when the session has no user', async () => {
    mockGetSession.mockResolvedValue({ data: { user: null } });

    await expect(requireAdminUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  test('returns the user when a valid session exists', async () => {
    const user = { id: 'user-1', email: 'admin@example.com' };
    mockGetSession.mockResolvedValue({ data: { user } });

    const result = await requireAdminUser();

    expect(result).toEqual(user);
  });
});
