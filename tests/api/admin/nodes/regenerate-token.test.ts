import { describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());
const mockGenerateNodeToken = vi.hoisted(() => vi.fn());

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

vi.mock('@/app/lib/auth/node-tokens', () => ({
  generateNodeToken: mockGenerateNodeToken,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { POST } from '@/app/api/admin/nodes/[id]/regenerate-token/route';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/admin/nodes/[id]/regenerate-token', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new Error('Unauthorized'));

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('node-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 404 when node does not exist or is not owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockGenerateNodeToken.mockReturnValue({ token: 'cpn_newtoken', tokenHash: 'hash123' });
    mockDbReturning.mockResolvedValue([]);

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('no-such-node'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/node not found/i);
  });

  test('returns 200 with new token when regeneration succeeds', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockGenerateNodeToken.mockReturnValue({ token: 'cpn_newtoken', tokenHash: 'hash123' });
    mockDbReturning.mockResolvedValue([{ id: 'node-uuid-1' }]);

    const response = await POST(new Request('http://localhost', { method: 'POST' }), makeContext('node-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.token).toBe('cpn_newtoken');
  });
});
