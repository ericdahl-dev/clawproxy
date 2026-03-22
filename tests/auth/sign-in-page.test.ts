// @vitest-environment jsdom
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: vi.fn(),
}));

vi.mock('@/app/lib/auth/dev-origin', () => ({
  useRedirect127ToLocalhost: vi.fn(),
}));

describe('SignInPage', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
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

  test('renders email and password inputs with a submit button', async () => {
    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    expect(container.querySelector('input[type="email"]')).not.toBeNull();
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Sign in');
  });

  test('renders links to forgot-password, sign-up, and home', async () => {
    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/auth/forgot-password');
    expect(hrefs).toContain('/auth/sign-up');
    expect(hrefs).toContain('/');
  });
});
