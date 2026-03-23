// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { setInputValue } from '../support/set-input-value';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = vi.fn();
const refreshMock = vi.fn();
const createNeonClientAuthMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: createNeonClientAuthMock,
}));

vi.mock('@/app/lib/auth/dev-origin', () => ({
  useRedirect127ToLocalhost: vi.fn(),
}));

describe('SignUpPage', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    createNeonClientAuthMock.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('renders name, email, and password inputs with a submit button', async () => {
    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    expect(container.querySelector('input[type="text"]')).not.toBeNull();
    expect(container.querySelector('input[type="email"]')).not.toBeNull();
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
      'Create account',
    );
  });

  test('renders links to sign-in and home', async () => {
    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/auth/sign-in');
    expect(hrefs).toContain('/');
  });

  test('shows success and navigates to sign-in after delay on successful sign-up', async () => {
    const signUpEmail = vi.fn().mockResolvedValue({});
    createNeonClientAuthMock.mockResolvedValue({ signUp: { email: signUpEmail } });

    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-up-name') as HTMLInputElement, 'Ada');
      setInputValue(container.querySelector('#sign-up-email') as HTMLInputElement, 'ada@e.com');
      setInputValue(container.querySelector('#sign-up-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(signUpEmail).toHaveBeenCalledWith({
      email: 'ada@e.com',
      password: 'pw',
      name: 'Ada',
    });
    expect(container.textContent).toContain('Account created');

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(pushMock).toHaveBeenCalledWith('/auth/sign-in');
    expect(refreshMock).toHaveBeenCalled();
  });

  test('uses email as name when name is blank', async () => {
    const signUpEmail = vi.fn().mockResolvedValue({});
    createNeonClientAuthMock.mockResolvedValue({ signUp: { email: signUpEmail } });

    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-up-email') as HTMLInputElement, 'solo@e.com');
      setInputValue(container.querySelector('#sign-up-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'solo@e.com',
      }),
    );
  });

  test('shows API error when signUp returns error', async () => {
    const signUpEmail = vi.fn().mockResolvedValue({ error: { message: 'Email taken' } });
    createNeonClientAuthMock.mockResolvedValue({ signUp: { email: signUpEmail } });

    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-up-email') as HTMLInputElement, 'u@e.com');
      setInputValue(container.querySelector('#sign-up-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('Email taken');
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('shows message when signUp throws', async () => {
    const signUpEmail = vi.fn().mockRejectedValue(new Error('boom'));
    createNeonClientAuthMock.mockResolvedValue({ signUp: { email: signUpEmail } });

    const { default: SignUpPage } = await import('@/app/auth/sign-up/page');

    await act(async () => {
      root.render(createElement(SignUpPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#sign-up-email') as HTMLInputElement, 'u@e.com');
      setInputValue(container.querySelector('#sign-up-password') as HTMLInputElement, 'pw');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('boom');
  });
});
