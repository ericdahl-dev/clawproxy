import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: () => ({
    signOut: signOutMock,
  }),
}));

describe('SignOutButton', () => {
  test('renders a sign out button', async () => {
    const { SignOutButton } = await import('@/app/dashboard/sign-out-button');
    const html = renderToStaticMarkup(createElement(SignOutButton));
    const dom = new JSDOM(html);

    expect(dom.window.document.querySelector('button')?.textContent?.trim()).toBe('Sign out');
  });

  test('renders an error state when sign out fails on the server-side render snapshot', async () => {
    const { SignOutButton } = await import('@/app/dashboard/sign-out-button');
    const html = renderToStaticMarkup(createElement(SignOutButton));
    const dom = new JSDOM(html);

    expect(dom.window.document.body.textContent).toContain('Sign out');
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
