import { NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';

describe('jsonOk / jsonError', () => {
  test('jsonOk returns 200 with ok true and body', async () => {
    const res = jsonOk({ items: [1] });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, items: [1] });
  });

  test('jsonError returns given status and ok false', async () => {
    const res = jsonError('Nope', 418);
    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ ok: false, error: 'Nope' });
  });
});

describe('withAdminUser', () => {
  beforeEach(() => {
    mockRequireAdminUser.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns 401 when requireAdminUser throws UnauthorizedError', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const res = await withAdminUser(async () => NextResponse.json({ ok: true }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: 'Unauthorized' });
  });

  test('returns 500 when handler throws after auth', async () => {
    mockRequireAdminUser.mockResolvedValue({ id: 'u1', email: 'a@b.c' });

    const res = await withAdminUser(async () => {
      throw new Error('db exploded');
    });

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: 'Something went wrong. Please try again.',
    });
    expect(console.error).toHaveBeenCalled();
  });

  test('returns handler NextResponse on success', async () => {
    const user = { id: 'u1', email: 'a@b.c' };
    mockRequireAdminUser.mockResolvedValue(user);

    const res = await withAdminUser(async (u) => {
      expect(u).toEqual(user);
      return NextResponse.json({ ok: true, x: 1 });
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, x: 1 });
  });
});
