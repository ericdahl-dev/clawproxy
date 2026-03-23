import { describe, expect, test, vi } from 'vitest';

import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';
import { mockAdminUser as mockUser } from '../../../helpers/admin-api-mocks';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbLimit } = vi.hoisted(() => {
  const mockDbLimit = vi.fn().mockResolvedValue([]);
  const mockDbWhere = vi.fn().mockReturnValue({ limit: mockDbLimit });
  const mockDbLeftJoin = vi.fn().mockReturnValue({ where: mockDbWhere });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ leftJoin: mockDbLeftJoin });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
  };

  return { mockDb, mockDbLimit };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { GET } from '@/app/api/admin/events/[id]/route';

const mockEvent = {
  id: 'event-uuid-1',
  nodeId: 'node-uuid-1',
  nodeName: 'My Node',
  routeId: 'route-uuid-1',
  status: 'pending',
  headersJson: { 'content-type': 'application/json' },
  bodyText: '{"key":"value"}',
  contentType: 'application/json',
  receivedAt: new Date(),
  leaseExpiresAt: null,
  attemptCount: 0,
  ackedAt: null,
  expiresAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/admin/events/[id]', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await GET(new Request('http://localhost'), makeContext('event-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 404 when the event does not exist', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbLimit.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost'), makeContext('nonexistent-id'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not found/i);
  });

  test('returns 200 with the full event detail', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbLimit.mockResolvedValue([mockEvent]);

    const response = await GET(new Request('http://localhost'), makeContext('event-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.event.id).toBe('event-uuid-1');
    expect(body.event.status).toBe('pending');
    expect(body.event.headersJson).toEqual({ 'content-type': 'application/json' });
    expect(body.event.bodyText).toBe('{"key":"value"}');
    expect(body.event.nodeName).toBe('My Node');
    expect(body.event.attemptCount).toBe(0);
  });
});
