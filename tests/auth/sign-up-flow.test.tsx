// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockPush, mockRefresh, mockSignUp, mockSignIn } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/app/lib/auth/client', () => ({
  createNeonClientAuth: vi.fn(async () => ({
    signUp: { email: mockSignUp },
    signIn: { email: mockSignIn },
  })),
}));

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), capture: vi.fn(), captureException: vi.fn() },
}));

import SignUpPage from '@/app/auth/sign-up/page';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('sign-up', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: {} });
    mockSignIn.mockResolvedValue({ data: {} });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function submit() {
    await act(async () => {
      root.render(createElement(SignUpPage));
    });
    const form = container.querySelector('form')!;
    (container.querySelector('#sign-up-email') as HTMLInputElement).value = 'new@example.com';
    (container.querySelector('#sign-up-password') as HTMLInputElement).value = 'hunter2hunter2';
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  test('signs the new account in and goes straight to the dashboard', async () => {
    await submit();

    expect(mockSignUp).toHaveBeenCalled();
    expect(mockSignIn).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  test('falls back to the sign-in page with a confirmation when auto sign-in fails', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'nope' } });

    await submit();

    expect(mockPush).toHaveBeenCalledWith('/auth/sign-in?registered=1');
  });
});
