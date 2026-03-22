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

describe('dashboard entry page', () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getSessionMock.mockReset();
  });

  test('redirects unauthenticated users to sign in', async () => {
    getSessionMock.mockResolvedValue({ data: null });

    const dashboardPage = await import('@/app/dashboard/page');

    await expect(dashboardPage.default()).rejects.toThrow('REDIRECT:/auth/sign-in?next=%2Fdashboard');
    expect(redirectMock).toHaveBeenCalledWith('/auth/sign-in?next=%2Fdashboard');
  });

  test('renders dashboard entry for authenticated users', async () => {
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

    const dashboardPage = await import('@/app/dashboard/page');
    const jsx = await dashboardPage.default();
    const html = renderToStaticMarkup(jsx);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(html).toContain('Dashboard');
    expect(html).toContain('admin@example.com');
    expect(html).toContain('Sign out');
  });
});
