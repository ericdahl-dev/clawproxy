import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

/**
 * Dashboard home runs three DB-backed queries in parallel via Promise.all plus
 * getDailyEventCounts (another select). Call order is not guaranteed, so we use
 * one from() shape that supports every chain instead of mockReturnValueOnce.
 */
const { mockDb, mockStatusGroupBy, mockDailyOrderBy, mockRecentLimit, mockNodeCount } = vi.hoisted(() => {
  const mockRecentLimit = vi.fn().mockResolvedValue([]);
  const mockRecentOrderBy = vi.fn().mockReturnValue({ limit: mockRecentLimit });
  const mockRecentWhere = vi.fn().mockReturnValue({ orderBy: mockRecentOrderBy });
  const mockLeftJoin = vi.fn().mockReturnValue({ where: mockRecentWhere });

  const mockDailyOrderBy = vi.fn().mockResolvedValue([]);
  const mockGroupBy = vi.fn().mockImplementation(() =>
    Object.assign(Promise.resolve([]), {
      orderBy: mockDailyOrderBy,
    }),
  );
  // `.where()` serves two shapes: the grouped status query (`.groupBy()`) and the node-count
  // query, which is awaited directly. Make it both a thenable and a chain.
  const mockNodeCount = vi.fn().mockResolvedValue([{ count: 0 }]);
  const mockWhereGrouped = vi.fn().mockImplementation(() =>
    Object.assign(mockNodeCount(), { groupBy: mockGroupBy }),
  );

  const mockFrom = vi.fn().mockImplementation(() => ({
    leftJoin: mockLeftJoin,
    where: mockWhereGrouped,
  }));

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockFrom }),
  };

  return {
    mockDb,
    mockStatusGroupBy: mockGroupBy,
    mockDailyOrderBy,
    mockRecentLimit,
    mockNodeCount,
  };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

vi.mock('@/app/lib/crypto/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

import DashboardOverviewPage from '@/app/dashboard/page';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

describe('dashboard overview page', () => {
  beforeEach(() => {
    mockRequireAdminUser.mockReset();
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockStatusGroupBy.mockReset();
    mockStatusGroupBy.mockImplementation(() =>
      Object.assign(Promise.resolve([]), {
        orderBy: mockDailyOrderBy,
      }),
    );
    mockDailyOrderBy.mockReset();
    mockDailyOrderBy.mockResolvedValue([]);
    mockRecentLimit.mockReset();
    mockRecentLimit.mockResolvedValue([]);
    mockNodeCount.mockReset();
    mockNodeCount.mockResolvedValue([{ count: 1 }]);
  });

  test('renders overview heading and description for an account with a node', async () => {
    const element = await DashboardOverviewPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Overview');
    expect(dom.window.document.body.textContent).toContain('Welcome back');
  });

  test('an account with no nodes gets a first-run prompt instead of zeroed metrics', async () => {
    mockNodeCount.mockResolvedValue([{ count: 0 }]);

    const element = await DashboardOverviewPage();
    const text = new JSDOM(renderToStaticMarkup(element)).window.document.body.textContent ?? '';

    expect(text).toContain('Set up your first node');
    expect(text).toContain('Create your first node');
    expect(text).not.toContain('Welcome back');
    expect(text).not.toContain('Success rate');
  });

  test('shows empty recent events when none are returned', async () => {
    const element = await DashboardOverviewPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain(
      'No events yet. Traffic will show up here after your routes receive webhooks.',
    );
  });
});
