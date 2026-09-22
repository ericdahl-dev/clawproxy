// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { searchParams } = vi.hoisted(() => ({ searchParams: { value: new URLSearchParams() } }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: vi.fn(async () => ({ signIn: { email: vi.fn() } })),
}));

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), capture: vi.fn(), captureException: vi.fn() },
}));

import SignInPage from '@/app/auth/sign-in/page';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('sign-in page', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    searchParams.value = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function render() {
    await act(async () => {
      root.render(createElement(SignInPage));
    });
    return container.textContent ?? '';
  }

  test('does not expose the auth vendor to users', async () => {
    const text = await render();
    expect(text).not.toContain('Neon Auth');
    expect(text).not.toContain('configuration flow');
  });

  test('offers a plain link to create an account', async () => {
    expect(await render()).toContain('Need an account?');
  });

  test('confirms the account was created when arriving from sign-up', async () => {
    searchParams.value = new URLSearchParams('registered=1');
    expect(await render()).toMatch(/account created/i);
  });
});
