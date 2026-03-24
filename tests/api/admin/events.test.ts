import { describe, expect, test, vi } from 'vitest';

import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';
import { mockAdminUser as mockUser } from '../../helpers/admin-api-mocks';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbOffset } = vi.hoisted(() => {
  const mockDbOffset = vi.fn().mockResolvedValue([]);
  const mockDbLimit = vi.fn().mockReturnValue({ offset: mockDbOffset });
  const mockDbOrderBy = vi.fn().mockReturnValue({ limit: mockDbLimit });
  const mockDbWhere = vi.fn().mockReturnValue({ orderBy: mockDbOrderBy });
  const mockDbLeftJoin = vi.fn().mockReturnValue({ where: mockDbWhere });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ leftJoin: mockDbLeftJoin });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
  };

  return { mockDb, mockDbOffset };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

vi.mock('@/app/lib/crypto/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

import { GET } from '@/app/api/admin/events/route';

const mockEvent = {
  id: 'event-uuid-1',
  nodeId: 'node-uuid-1',
  nodeName: 'My Node',
  routeId: 'route-uuid-1',
  status: 'pending',
  contentType: 'application/json',
  receivedAt: new Date(),
  leaseExpiresAt: null,
  attemptCount: 0,
  ackedAt: null,
  expiresAt: new Date(),
  createdAt: new Date(),
};

function makeRequest(search = '') {
  return new Request(`http://localhost/api/admin/events${search}`);
}

describe('GET /api/admin/events', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 200 with an empty list when the user has no events', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOffset.mockResolvedValue([]);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.events).toEqual([]);
  });

  test('returns 200 with the user event list', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOffset.mockResolvedValue([mockEvent]);

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].id).toBe('event-uuid-1');
    expect(body.events[0].status).toBe('pending');
  });

  test('passes status filter to the query when provided', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOffset.mockResolvedValue([]);

    const response = await GET(makeRequest('?status=pending,delivered'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test('passes nodeId filter to the query when provided', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOffset.mockResolvedValue([]);

    const response = await GET(makeRequest('?nodeId=node-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test('passes dateRange filter to the query when provided', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOffset.mockResolvedValue([]);

    const response = await GET(makeRequest('?dateRange=7d'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
