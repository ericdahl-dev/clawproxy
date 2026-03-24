import { describe, expect, test, vi } from 'vitest';

import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';
import { mockAdminUser as mockUser } from '../../helpers/admin-api-mocks';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbOrderBy, mockDbInsertReturning } = vi.hoisted(() => {
  const mockDbOrderBy = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ orderBy: mockDbOrderBy });
  const mockDbSelectLeftJoin = vi.fn().mockReturnValue({ where: mockDbSelectWhere });

  const mockDbSelectLimit = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere2 = vi.fn().mockReturnValue({ limit: mockDbSelectLimit });

  // select() is called for two different queries in the route:
  // 1. listing routes (leftJoin → where → orderBy)
  // 2. ownership check (where → limit)
  // We alternate returns based on call order.
  const mockDbSelectFrom = vi.fn();
  mockDbSelectFrom
    .mockReturnValueOnce({ leftJoin: mockDbSelectLeftJoin }) // list routes
    .mockReturnValue({ where: mockDbSelectWhere2 }); // ownership check (and subsequent)

  const mockDbInsertReturning = vi.fn().mockResolvedValue([]);
  const mockDbInsertValues = vi.fn().mockReturnValue({ returning: mockDbInsertReturning });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
    insert: vi.fn().mockReturnValue({ values: mockDbInsertValues }),
  };

  return { mockDb, mockDbOrderBy, mockDbInsertReturning };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

vi.mock('@/app/lib/crypto/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

import { GET, POST } from '@/app/api/admin/routes/route';

const mockRoute = {
  id: 'route-uuid-1',
  nodeId: 'node-uuid-1',
  slug: 'my-webhook',
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/admin/routes', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 200 with the user route list', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockResolvedValue([mockRoute]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.routes).toHaveLength(1);
    expect(body.routes[0].slug).toBe('my-webhook');
  });
});

describe('POST /api/admin/routes', () => {
  function makeRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/admin/routes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await POST(makeRequest({ nodeId: 'n', slug: 'my-webhook' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 400 when nodeId is missing', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const response = await POST(makeRequest({ slug: 'my-webhook' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/required/i);
  });

  test('returns 400 when slug is missing', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const response = await POST(makeRequest({ nodeId: 'node-uuid-1' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/required/i);
  });

  test('returns 404 when node is not owned by the user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    // reset from call so the limit path is hit first
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
    });

    const response = await POST(makeRequest({ nodeId: 'node-uuid-1', slug: 'my-webhook' }));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/node not found/i);
  });

  test('creates route and returns it when node is owned', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    // Ownership check succeeds
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'node-uuid-1' }]) }),
      }),
    });
    mockDbInsertReturning.mockResolvedValue([mockRoute]);

    const response = await POST(makeRequest({ nodeId: 'node-uuid-1', slug: 'my-webhook' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.route.slug).toBe('my-webhook');
  });

  test('returns 409 when the route slug is already in use', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'node-uuid-1' }]) }),
      }),
    });
    const uniqueViolation = Object.assign(new Error('duplicate key'), { code: '23505' });
    mockDbInsertReturning.mockRejectedValue(uniqueViolation);

    const response = await POST(makeRequest({ nodeId: 'node-uuid-1', slug: 'taken-slug' }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/slug is already in use/i);
  });
});
