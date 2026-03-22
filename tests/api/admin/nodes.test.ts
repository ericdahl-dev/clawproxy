import { describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbOrderBy, mockDbInsertReturning } = vi.hoisted(() => {
  const mockDbOrderBy = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ orderBy: mockDbOrderBy });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ where: mockDbSelectWhere });

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

import { GET, POST } from '@/app/api/admin/nodes/route';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

const mockNode = {
  id: 'node-uuid-1',
  name: 'My Node',
  slug: 'my-node',
  status: 'active',
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GET /api/admin/nodes', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 200 with the user node list', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockResolvedValue([mockNode]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.nodes).toHaveLength(1);
    expect(body.nodes[0].slug).toBe('my-node');
  });

  test('returns 200 with an empty list when user has no nodes', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.nodes).toEqual([]);
  });
});

describe('POST /api/admin/nodes', () => {
  function makeRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/admin/nodes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await POST(makeRequest({ name: 'My Node' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 400 when name is missing', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const response = await POST(makeRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/name is required/i);
  });

  test('returns 400 when name is blank', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const response = await POST(makeRequest({ name: '   ' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  test('creates node and returns token when name is valid', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbInsertReturning.mockResolvedValue([mockNode]);

    const response = await POST(makeRequest({ name: 'My Node' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.node.slug).toBe('my-node');
    expect(typeof body.token).toBe('string');
    expect(body.token.startsWith('cpn_')).toBe(true);
  });

  test('uses provided slug instead of slugifying the name', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbInsertReturning.mockResolvedValue([{ ...mockNode, slug: 'custom-slug' }]);

    const response = await POST(makeRequest({ name: 'My Node', slug: 'custom-slug' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test('auto-slugifies the node name', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    // capture what values() is called with to verify the slug
    let capturedValues: Record<string, unknown> = {};
    mockDb.insert.mockReturnValue({
      values: vi.fn((v: Record<string, unknown>) => {
        capturedValues = v;
        return { returning: mockDbInsertReturning };
      }),
    });
    mockDbInsertReturning.mockResolvedValue([{ ...mockNode, slug: 'hello-world' }]);

    await POST(makeRequest({ name: 'Hello World' }));

    expect(capturedValues.slug).toBe('hello-world');
  });
});
