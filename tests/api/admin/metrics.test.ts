import { describe, expect, test, vi } from 'vitest';

import { UnauthorizedError } from '@/app/lib/auth/unauthorized-error';
import { mockAdminUser as mockUser } from '../../helpers/admin-api-mocks';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbGroupBy } = vi.hoisted(() => {
  const mockDbGroupBy = vi.fn().mockResolvedValue([]);
  const mockDbWhere = vi.fn().mockReturnValue({ groupBy: mockDbGroupBy });
  const mockDbFrom = vi.fn().mockReturnValue({ where: mockDbWhere });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbFrom }),
  };

  return { mockDb, mockDbGroupBy };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { GET } from '@/app/api/admin/metrics/route';

describe('GET /api/admin/metrics', () => {
  test('returns 401 when user is not authenticated', async () => {
    mockRequireAdminUser.mockRejectedValue(new UnauthorizedError());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  test('returns zeroed metrics when there are no events', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbGroupBy.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.metrics.total).toBe(0);
    expect(body.metrics.successRate).toBe(0);
    expect(body.metrics.byStatus.pending).toBe(0);
    expect(body.metrics.byStatus.delivered).toBe(0);
  });

  test('calculates success rate correctly', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbGroupBy.mockResolvedValue([
      { status: 'delivered', count: 8 },
      { status: 'failed', count: 2 },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.metrics.total).toBe(10);
    expect(body.metrics.successRate).toBe(80);
    expect(body.metrics.byStatus.delivered).toBe(8);
    expect(body.metrics.byStatus.failed).toBe(2);
    expect(body.metrics.byStatus.pending).toBe(0);
  });

  test('returns all status counts', async () => {
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbGroupBy.mockResolvedValue([
      { status: 'pending', count: 3 },
      { status: 'leased', count: 1 },
      { status: 'delivered', count: 10 },
      { status: 'failed', count: 2 },
      { status: 'expired', count: 4 },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metrics.total).toBe(20);
    expect(body.metrics.byStatus.pending).toBe(3);
    expect(body.metrics.byStatus.leased).toBe(1);
    expect(body.metrics.byStatus.delivered).toBe(10);
    expect(body.metrics.byStatus.failed).toBe(2);
    expect(body.metrics.byStatus.expired).toBe(4);
  });
});
