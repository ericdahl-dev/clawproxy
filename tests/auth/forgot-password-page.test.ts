// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { setInputValue } from '../support/set-input-value';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const createNeonClientAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: createNeonClientAuthMock,
}));

vi.mock('@/app/lib/auth/dev-origin', () => ({
  useRedirect127ToLocalhost: vi.fn(),
}));

describe('ForgotPasswordPage', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    createNeonClientAuthMock.mockReset();
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

  test('renders an email input with a submit button', async () => {
    const { default: ForgotPasswordPage } = await import('@/app/auth/forgot-password/page');

    await act(async () => {
      root.render(createElement(ForgotPasswordPage));
    });

    expect(container.querySelector('input[type="email"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
      'Send reset email',
    );
  });

  test('renders links to sign-in and sign-up', async () => {
    const { default: ForgotPasswordPage } = await import('@/app/auth/forgot-password/page');

    await act(async () => {
      root.render(createElement(ForgotPasswordPage));
    });

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(hrefs).toContain('/auth/sign-in');
    expect(hrefs).toContain('/auth/sign-up');
  });

  test('shows success message after requestPasswordReset succeeds', async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue({});
    createNeonClientAuthMock.mockResolvedValue({ requestPasswordReset });

    const { default: ForgotPasswordPage } = await import('@/app/auth/forgot-password/page');

    await act(async () => {
      root.render(createElement(ForgotPasswordPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#forgot-email') as HTMLInputElement, 'u@e.com');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(requestPasswordReset).toHaveBeenCalledWith({
      email: 'u@e.com',
      redirectTo: '/auth/sign-in',
    });
    expect(container.textContent).toContain('If that account exists');
  });

  test('shows API error when reset returns error', async () => {
    const requestPasswordReset = vi.fn().mockResolvedValue({ error: { message: 'Rate limited' } });
    createNeonClientAuthMock.mockResolvedValue({ requestPasswordReset });

    const { default: ForgotPasswordPage } = await import('@/app/auth/forgot-password/page');

    await act(async () => {
      root.render(createElement(ForgotPasswordPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#forgot-email') as HTMLInputElement, 'u@e.com');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('Rate limited');
  });

  test('shows message when requestPasswordReset throws', async () => {
    const requestPasswordReset = vi.fn().mockRejectedValue(new Error('offline'));
    createNeonClientAuthMock.mockResolvedValue({ requestPasswordReset });

    const { default: ForgotPasswordPage } = await import('@/app/auth/forgot-password/page');

    await act(async () => {
      root.render(createElement(ForgotPasswordPage));
    });

    await act(async () => {
      setInputValue(container.querySelector('#forgot-email') as HTMLInputElement, 'u@e.com');
    });

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    });

    expect(container.textContent).toContain('offline');
  });
});
