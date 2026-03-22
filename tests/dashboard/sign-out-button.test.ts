// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Tell React this environment supports act()
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    signOutMock.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('renders a sign out button', async () => {
    const { SignOutButton } = await import('@/app/dashboard/sign-out-button');
    await act(async () => {
      root.render(createElement(SignOutButton));
    });

    expect(container.querySelector('button')?.textContent?.trim()).toBe('Sign out');
  });

  test('shows an error message when sign out fails', async () => {
    signOutMock.mockResolvedValue({ error: { message: 'Network error' } });
    const { SignOutButton } = await import('@/app/dashboard/sign-out-button');

    await act(async () => {
      root.render(createElement(SignOutButton));
    });

    await act(async () => {
      container.querySelector('button')?.click();
    });

    expect(container.textContent).toContain('Network error');
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
