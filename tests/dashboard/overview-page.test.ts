import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

/**
 * Dashboard home runs three DB-backed queries in parallel via Promise.all plus
 * getDailyEventCounts (another select). Call order is not guaranteed, so we use
 * one from() shape that supports every chain instead of mockReturnValueOnce.
 */
const { mockDb, mockStatusGroupBy, mockDailyOrderBy, mockRecentLimit } = vi.hoisted(() => {
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
  const mockWhereGrouped = vi.fn().mockReturnValue({ groupBy: mockGroupBy });

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
  });

  test('renders overview heading and description', async () => {
    const element = await DashboardOverviewPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Overview');
    expect(dom.window.document.body.textContent).toContain('Welcome back');
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
