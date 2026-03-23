import { describe, expect, test, vi } from 'vitest';

import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';
import { mockAdminUser as mockUser } from '../../../helpers/admin-api-mocks';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbDeleteReturning, mockDbUpdateReturning } = vi.hoisted(() => {
  const mockDbDeleteReturning = vi.fn().mockResolvedValue([]);
  const mockDbDeleteWhere = vi.fn().mockReturnValue({ returning: mockDbDeleteReturning });
  const mockDbDelete = { where: mockDbDeleteWhere };

  const mockDbUpdateReturning = vi.fn().mockResolvedValue([]);
  const mockDbUpdateWhere = vi.fn().mockReturnValue({ returning: mockDbUpdateReturning });
  const mockDbUpdateSet = vi.fn().mockReturnValue({ where: mockDbUpdateWhere });
  const mockDbUpdate = { set: mockDbUpdateSet };

  const mockDb = {
    delete: vi.fn().mockReturnValue(mockDbDelete),
    update: vi.fn().mockReturnValue(mockDbUpdate),
  };

  return { mockDb, mockDbDeleteReturning, mockDbUpdateReturning };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { DELETE, PATCH } from '@/app/api/admin/routes/[id]/route';

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeDeleteRequest() {
  return new Request('http://localhost/api/admin/routes/route-uuid-1', { method: 'DELETE' });
}

function makePatchRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/routes/route-uuid-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('DELETE /api/admin/routes/[id]', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await DELETE(makeDeleteRequest(), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 404 when route does not exist or is not owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbDeleteReturning.mockResolvedValue([]);

    const response = await DELETE(makeDeleteRequest(), makeContext('no-such-route'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/route not found/i);
  });

  test('returns 200 and deletes the route when it exists and is owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbDeleteReturning.mockResolvedValue([{ id: 'route-uuid-1' }]);

    const response = await DELETE(makeDeleteRequest(), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  test('returns 500 when delete fails unexpectedly', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbDeleteReturning.mockRejectedValueOnce(new Error('db down'));

    const response = await DELETE(makeDeleteRequest(), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/something went wrong/i);
  });
});

describe('PATCH /api/admin/routes/[id]', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await PATCH(makePatchRequest({ enabled: false }), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns 400 when enabled is missing', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const response = await PATCH(makePatchRequest({}), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/required/i);
  });

  test('returns 400 when request body is invalid JSON', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/admin/routes/route-uuid-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: '{"enabled": true', // missing closing brace
    });

    const response = await PATCH(request, makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/invalid json/i);
  });

  test('returns 404 when route does not exist or is not owned by user', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbUpdateReturning.mockResolvedValue([]);

    const response = await PATCH(makePatchRequest({ enabled: false }), makeContext('no-such-route'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/route not found/i);
  });

  test('returns 200 and updates enabled when route is owned', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbUpdateReturning.mockResolvedValue([{ id: 'route-uuid-1', enabled: false }]);

    const response = await PATCH(makePatchRequest({ enabled: false }), makeContext('route-uuid-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.route.enabled).toBe(false);
  });
});
