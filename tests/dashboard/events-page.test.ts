import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbEventsLimit, mockDbNodesOrderBy, mockDbSelectFrom, mockDbEventsLeftJoin } =
  vi.hoisted(() => {
    // Events query chain: select().from(events).leftJoin(nodes).where().orderBy().limit()
    const mockDbEventsLimit = vi.fn().mockResolvedValue([]);
    const mockDbEventsOrderBy = vi.fn().mockReturnValue({ limit: mockDbEventsLimit });
    const mockDbEventsWhere = vi.fn().mockReturnValue({ orderBy: mockDbEventsOrderBy });
    const mockDbEventsLeftJoin = vi.fn().mockReturnValue({ where: mockDbEventsWhere });

    // Nodes query chain: select().from(nodes).where().orderBy()
    const mockDbNodesOrderBy = vi.fn().mockResolvedValue([]);
    const mockDbNodesWhere = vi.fn().mockReturnValue({ orderBy: mockDbNodesOrderBy });

    // from() alternates: first call returns events chain, subsequent calls return nodes chain
    const mockDbSelectFrom = vi
      .fn()
      .mockReturnValueOnce({ leftJoin: mockDbEventsLeftJoin })
      .mockReturnValue({ where: mockDbNodesWhere });

    const mockDb = {
      select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
    };

    return {
      mockDb,
      mockDbEventsLimit,
      mockDbNodesOrderBy,
      mockDbSelectFrom,
      mockDbEventsLeftJoin,
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

import DashboardEventsPage from '@/app/dashboard/events/page';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

describe('dashboard events page', () => {
  beforeEach(() => {
    mockRequireAdminUser.mockReset();
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbEventsLimit.mockReset();
    mockDbEventsLimit.mockResolvedValue([]);
    mockDbNodesOrderBy.mockReset();
    mockDbNodesOrderBy.mockResolvedValue([]);
    mockDbSelectFrom.mockReset();
    mockDbSelectFrom
      .mockReturnValueOnce({ leftJoin: mockDbEventsLeftJoin })
      .mockReturnValue({
        where: vi.fn().mockReturnValue({ orderBy: mockDbNodesOrderBy }),
      });
  });

  test('renders events heading and description', async () => {
    const element = await DashboardEventsPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Delivery events');
    expect(dom.window.document.body.textContent).toContain('Events');
  });

  test('shows a placeholder when no delivery events are available', async () => {
    const element = await DashboardEventsPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('No delivery events are available yet');
  });
});
