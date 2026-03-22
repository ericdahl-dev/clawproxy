import { describe, expect, test, vi } from 'vitest';

const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/auth/server', () => ({
  auth: { getSession: mockGetSession },
}));

import { requireAdminUser } from '@/app/lib/auth/require-admin';

describe('requireAdminUser', () => {
  test('throws Unauthorized when there is no active session', async () => {
    mockGetSession.mockResolvedValue({ data: null });

    await expect(requireAdminUser()).rejects.toThrow('Unauthorized');
  });

  test('throws Unauthorized when the session has no user', async () => {
    mockGetSession.mockResolvedValue({ data: { user: null } });

    await expect(requireAdminUser()).rejects.toThrow('Unauthorized');
  });

  test('returns the user when a valid session exists', async () => {
    const user = { id: 'user-1', email: 'admin@example.com' };
    mockGetSession.mockResolvedValue({ data: { user } });

    const result = await requireAdminUser();

    expect(result).toEqual(user);
  });
});
