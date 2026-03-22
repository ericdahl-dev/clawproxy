import { describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbReturning } = vi.hoisted(() => {
  const mockDbReturning = vi.fn().mockResolvedValue([]);
  const mockDbWhere = vi.fn().mockReturnValue({ returning: mockDbReturning });
  const mockDbSet = vi.fn().mockReturnValue({ where: mockDbWhere });

  const mockDb = {
    update: vi.fn().mockReturnValue({ set: mockDbSet }),
  };

  return { mockDb, mockDbReturning };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { POST } from '@/app/api/admin/events/[id]/retry/route';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/admin/events/[id]/retry', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('event-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 404 when event does not exist or is not retryable', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbReturning.mockResolvedValue([]);

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('nonexistent-id'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not found or not retryable/i);
  });

  test('returns 200 when event is successfully reset to pending', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbReturning.mockResolvedValue([{ id: 'event-uuid-1' }]);

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('event-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
