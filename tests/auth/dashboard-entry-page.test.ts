import { JSDOM } from 'jsdom';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mockRequireAdminUser = vi.hoisted(() => vi.fn());

const mockSelectCall = vi.hoisted(() => ({ n: 0 }));

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      const i = mockSelectCall.n++;
      return {
        from: () => {
          if (i === 0) {
            return {
              where: () => ({
                groupBy: () => Promise.resolve([]),
              }),
            };
          }
          return {
            leftJoin: () => ({
              where: () => ({
                orderBy: () => ({
                  limit: () => Promise.resolve([]),
                }),
              }),
            }),
          };
        },
      };
    }),
  };

  return { mockDb };
});

vi.mock('@/app/lib/auth/require-admin', () => ({
  requireAdminUser: mockRequireAdminUser,
}));

vi.mock('@/app/lib/dashboard/event-daily-counts', () => {
  const days = 30;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);
  const series = Array.from({ length: days }, (_, idx) => {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + idx);
    return { date: d.toISOString().slice(0, 10), events: 0 };
  });
  return {
    DAILY_EVENT_CHART_DAYS: days,
    getDailyEventCounts: vi.fn().mockResolvedValue(series),
  };
});

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

describe('dashboard entry page', () => {
  test('renders dashboard entry content', async () => {
    mockRequireAdminUser.mockResolvedValue({ id: 'user-1', email: 'admin@example.com' });
    mockSelectCall.n = 0;

    const dashboardPage = await import('@/app/dashboard/page');
    const html = renderToStaticMarkup(await dashboardPage.default());
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Welcome back');
    expect(dom.window.document.body.textContent).toContain('Live relay console');
    expect(dom.window.document.body.textContent).toContain('Hermes Agent and OpenClaw');
    expect(dom.window.document.body.textContent).toContain('Event metrics');
    expect(dom.window.document.body.textContent).toContain('Events over time');
    expect(dom.window.document.body.textContent).toContain('Recent events');
  });
});
