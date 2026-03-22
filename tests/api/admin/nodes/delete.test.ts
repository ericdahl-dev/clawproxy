import { describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbDelete } = vi.hoisted(() => {
  const mockDbDeleteReturning = vi.fn().mockResolvedValue([]);
  const mockDbDeleteWhere = vi.fn().mockReturnValue({ returning: mockDbDeleteReturning });

  const mockDbDelete = {
    where: mockDbDeleteWhere,
    returning: mockDbDeleteReturning,
  };

  const mockDb = {
    delete: vi.fn().mockReturnValue(mockDbDelete),
  };

  return { mockDb, mockDbDelete };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { DELETE } from '@/app/api/admin/nodes/[id]/route';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest() {
  return new Request('http://localhost/api/admin/nodes/node-uuid-1', {
    method: 'DELETE',
  });
}

describe('DELETE /api/admin/nodes/[id]', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await DELETE(makeRequest(), makeContext('node-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 404 when node does not exist or is not owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbDelete.returning.mockResolvedValue([]);

    const response = await DELETE(makeRequest(), makeContext('no-such-node'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/node not found/i);
  });

  test('returns 200 and deletes the node when it exists and is owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbDelete.returning.mockResolvedValue([{ id: 'node-uuid-1' }]);

    const response = await DELETE(makeRequest(), makeContext('node-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
