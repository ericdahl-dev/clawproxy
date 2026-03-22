import { describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbOrderBy } = vi.hoisted(() => {
  const mockDbOrderBy = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ orderBy: mockDbOrderBy });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ where: mockDbSelectWhere });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
  };

  return { mockDb, mockDbOrderBy };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { GET } from '@/app/api/admin/events/route';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

const mockEvent = {
  id: 'event-uuid-1',
  nodeId: 'node-uuid-1',
  routeId: 'route-uuid-1',
  status: 'pending',
  contentType: 'application/json',
  receivedAt: new Date(),
  leaseExpiresAt: null,
  ackedAt: null,
  expiresAt: new Date(),
  createdAt: new Date(),
};

describe('GET /api/admin/events', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 200 with an empty list when the user has no events', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.events).toEqual([]);
  });

  test('returns 200 with the user event list', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockResolvedValue([mockEvent]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].id).toBe('event-uuid-1');
    expect(body.events[0].status).toBe('pending');
  });
});
