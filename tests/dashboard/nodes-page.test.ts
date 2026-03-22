import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const { mockDb, mockDbOrderBy } = vi.hoisted(() => {
  const mockDbOrderBy = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ orderBy: mockDbOrderBy });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ where: mockDbSelectWhere });
  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
  };
  return { mockDb, mockDbOrderBy };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import DashboardNodesPage from '@/app/dashboard/nodes/page';

const mockUser = { id: 'user-1', email: 'admin@example.com' };

describe('dashboard nodes page', () => {
  beforeEach(() => {
    mockRequireAdminUser.mockReset();
    mockRequireAdminUser.mockResolvedValue(mockUser);
    mockDbOrderBy.mockReset();
    mockDbOrderBy.mockResolvedValue([]);
  });

  test('renders nodes heading and description', async () => {
    const element = await DashboardNodesPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Connected nodes');
    expect(dom.window.document.body.textContent).toContain('Nodes');
  });

  test('shows a placeholder when no nodes are registered', async () => {
    const element = await DashboardNodesPage();
    const html = renderToStaticMarkup(element);
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('No nodes have been registered yet');
  });
});
