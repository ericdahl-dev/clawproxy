// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useRedirect127ToLocalhost } from '@/app/lib/auth/dev-origin';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function HookHost() {
  useRedirect127ToLocalhost();
  return null;
}

describe('useRedirect127ToLocalhost', () => {
  let container: HTMLElement;
  let root: Root;
  const originalNodeEnv = process.env.NODE_ENV;
  const replaceSpy = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    replaceSpy.mockClear();
    vi.stubGlobal('location', {
      hostname: '127.0.0.1',
      href: 'http://127.0.0.1:3000/auth/sign-in',
      replace: replaceSpy,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('replaces 127.0.0.1 with localhost in development', async () => {
    process.env.NODE_ENV = 'development';

    await act(async () => {
      root.render(createElement(HookHost));
    });

    expect(replaceSpy).toHaveBeenCalledWith('http://localhost:3000/auth/sign-in');
  });

  test('does not redirect when hostname is already localhost', async () => {
    process.env.NODE_ENV = 'development';
    vi.stubGlobal('location', {
      hostname: 'localhost',
      href: 'http://localhost:3000/auth/sign-in',
      replace: replaceSpy,
    });

    await act(async () => {
      root.render(createElement(HookHost));
    });

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  test('does not redirect outside development', async () => {
    process.env.NODE_ENV = 'production';

    await act(async () => {
      root.render(createElement(HookHost));
    });

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
