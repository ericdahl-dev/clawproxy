import { JSDOM } from 'jsdom';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

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

describe('dashboard entry page', () => {
  test('renders dashboard entry content', async () => {
    mockRequireAdminUser.mockResolvedValue({ id: 'user-1', email: 'admin@example.com' });
    mockDbGroupBy.mockResolvedValue([]);

    const dashboardPage = await import('@/app/dashboard/page');
    const html = renderToStaticMarkup(await dashboardPage.default());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Welcome back');
    expect(dom.window.document.body.textContent).toContain('Nodes');
    expect(dom.window.document.body.textContent).toContain('Routes');
    expect(dom.window.document.body.textContent).toContain('Events');
  });
});
