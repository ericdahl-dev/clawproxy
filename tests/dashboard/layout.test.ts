import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

const getSessionMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/app/lib/auth/server', () => ({
  auth: {
    getSession: getSessionMock,
  },
}));

describe('dashboard layout', () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getSessionMock.mockReset();
  });

  test('redirects unauthenticated users to sign in', async () => {
    getSessionMock.mockResolvedValue({ data: null });
    const dashboardLayout = await import('@/app/dashboard/layout');

    await expect(
      dashboardLayout.default({ children: createElement('div', null, 'Dashboard content') }),
    ).rejects.toThrow('REDIRECT:/auth/sign-in?next=%2Fdashboard');
    expect(redirectMock).toHaveBeenCalledWith('/auth/sign-in?next=%2Fdashboard');
  });

  test('renders dashboard shell with navigation and sign out for authenticated users', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        id: 'session_123',
        userId: 'user_123',
        token: 'token_123',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
        user: {
          id: 'user_123',
          email: 'admin@example.com',
        },
      },
    });

    const dashboardLayout = await import('@/app/dashboard/layout');
    const html = renderToStaticMarkup(
      await dashboardLayout.default({ children: createElement('section', null, 'Dashboard content') }),
    );
    const dom = new JSDOM(html);
    const document = dom.window.document;

    expect(document.querySelector('main')).not.toBeNull();
    expect(document.querySelector('nav')).not.toBeNull();
    expect(document.querySelector('a[href="/dashboard/nodes"]')?.textContent?.trim()).toBe(
      'Nodes',
    );
    expect(document.querySelector('a[href="/dashboard/routes"]')?.textContent?.trim()).toBe(
      'Routes',
    );
    expect(document.querySelector('a[href="/dashboard/events"]')?.textContent?.trim()).toBe(
      'Events',
    );
    expect(document.body.textContent).toContain('admin@example.com');
    expect(document.body.textContent).toContain('Sign out');
    expect(document.body.textContent).toContain('Dashboard content');
  });
});
