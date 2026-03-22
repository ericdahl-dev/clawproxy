import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbRoutesOrderBy, mockDbNodesOrderBy, mockDbSelectFrom, mockDbRoutesLeftJoin } =
  vi.hoisted(() => {
    // Routes query chain: select().from(routes).leftJoin(nodes).where().orderBy()
    const mockDbRoutesOrderBy = vi.fn().mockResolvedValue([]);
    const mockDbRoutesWhere = vi.fn().mockReturnValue({ orderBy: mockDbRoutesOrderBy });
    const mockDbRoutesLeftJoin = vi.fn().mockReturnValue({ where: mockDbRoutesWhere });

    // Nodes query chain: select().from(nodes).where().orderBy()
    const mockDbNodesOrderBy = vi.fn().mockResolvedValue([{ id: 'node-1', name: 'My Node' }]);
    const mockDbNodesWhere = vi.fn().mockReturnValue({ orderBy: mockDbNodesOrderBy });

    // from() alternates: first call returns routes chain, subsequent calls return nodes chain
    const mockDbSelectFrom = vi
      .fn()
      .mockReturnValueOnce({ leftJoin: mockDbRoutesLeftJoin })
      .mockReturnValue({ where: mockDbNodesWhere });

    const mockDb = {
      select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
    };

    return { mockDb, mockDbRoutesOrderBy, mockDbNodesOrderBy, mockDbSelectFrom, mockDbRoutesLeftJoin };
  });

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import DashboardRoutesPage from '@/app/dashboard/routes/page';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

describe('dashboard routes page', () => {
  beforeEach(() => {
    mockRequireAdminUser.mockReset();
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbRoutesOrderBy.mockReset();
    mockDbRoutesOrderBy.mockResolvedValue([]);
    mockDbNodesOrderBy.mockReset();
    mockDbNodesOrderBy.mockResolvedValue([{ id: 'node-1', name: 'My Node' }]);
    // Restore the routes/nodes alternating behaviour on from()
    mockDbSelectFrom.mockReset();
    mockDbSelectFrom
      .mockReturnValueOnce({ leftJoin: mockDbRoutesLeftJoin })
      .mockReturnValue({ where: vi.fn().mockReturnValue({ orderBy: mockDbNodesOrderBy }) });
  });

  test('renders routes heading and description', async () => {
    const element = await DashboardRoutesPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Webhook routes');
    expect(dom.window.document.body.textContent).toContain('Routes');
  });

  test('shows a placeholder when no routes are configured', async () => {
    const element = await DashboardRoutesPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('No routes have been configured yet');
  });
});
