// @vitest-environment jsdom
import { act, createElement, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { setInputValue } from '../support/set-input-value';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = vi.fn();
const refreshMock = vi.fn();
const navState = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));
const createNeonClientAuthMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => navState.searchParams,
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: createNeonClientAuthMock,
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
    createNeonClientAuthMock.mockReset();
    navState.searchParams = new URLSearchParams();
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

  test('submits credentials and redirects to dashboard on success', async () => {
    const signInEmail = vi.fn().mockResolvedValue({});
    createNeonClientAuthMock.mockResolvedValue({ signIn: { email: signInEmail } });

    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    const emailInput = container.querySelector('#sign-in-email') as HTMLInputElement;
    const passwordInput = container.querySelector('#sign-in-password') as HTMLInputElement;

    await act(async () => {
      setInputValue(emailInput, 'user@example.com');
      setInputValue(passwordInput, 'secret');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(signInEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
    expect(refreshMock).toHaveBeenCalled();
  });

  test('respects safe next search param after sign-in', async () => {
    navState.searchParams = new URLSearchParams('next=/dashboard/nodes');
    const signInEmail = vi.fn().mockResolvedValue({});
    createNeonClientAuthMock.mockResolvedValue({ signIn: { email: signInEmail } });

    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-in-email') as HTMLInputElement, 'u@e.com');
      setInputValue(container.querySelector('#sign-in-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(pushMock).toHaveBeenCalledWith('/dashboard/nodes');
  });

  test('shows API error message when signIn returns error', async () => {
    const signInEmail = vi
      .fn()
      .mockResolvedValue({ error: { message: 'Invalid credentials' } });
    createNeonClientAuthMock.mockResolvedValue({ signIn: { email: signInEmail } });

    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-in-email') as HTMLInputElement, 'u@e.com');
      setInputValue(container.querySelector('#sign-in-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('Invalid credentials');
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('shows generic message when signIn throws', async () => {
    const signInEmail = vi.fn().mockRejectedValue(new Error('network down'));
    createNeonClientAuthMock.mockResolvedValue({ signIn: { email: signInEmail } });

    const { default: SignInPage } = await import('@/app/auth/sign-in/page');

    await act(async () => {
      root.render(createElement(Suspense, { fallback: null }, createElement(SignInPage)));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-in-email') as HTMLInputElement, 'u@e.com');
      setInputValue(container.querySelector('#sign-in-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('network down');
  });
});
