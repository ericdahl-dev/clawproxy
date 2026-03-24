// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { RoutesClient } from '@/app/dashboard/routes/routes-client';

import { setInputValue } from '../support/set-input-value';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('RoutesClient', () => {
  let container: HTMLElement;
  let root: Root;
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  test('creates a route and prepends it to the list', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          route: {
            id: 'new-r',
            userId: 'user-1',
            nodeId: 'node-1',
            slug: 'my-hook',
            enabled: true,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    );

    await act(async () => {
      root.render(
        createElement(RoutesClient, {
          initialRoutes: [],
          availableNodes: [{ id: 'node-1', name: 'Primary' }],
        }),
      );
    });

    await act(async () => {
      (Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Add route') ??
        null)!.click();
    });

    const slugInput = container.querySelector('input#route-slug') as HTMLInputElement;
    expect(slugInput).toBeTruthy();

    await act(async () => {
      setInputValue(slugInput, 'my-hook');
    });

    await act(async () => {
      (
        Array.from(container.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Create route',
        ) ?? null
      )!.click();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/routes',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(container.textContent).toContain('my-hook');
    expect(container.textContent).toContain('Primary');
  });
});
