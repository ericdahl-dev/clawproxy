// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: vi.fn(),
}));

vi.mock('@/app/lib/auth/dev-origin', () => ({
  useRedirect127ToLocalhost: vi.fn(),
}));

describe('ForgotPasswordPage', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
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
});
