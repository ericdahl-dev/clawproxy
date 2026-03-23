// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NodesClient } from '@/app/dashboard/nodes/nodes-client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('NodesClient', () => {
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

  test('deletes a node after confirming the modal', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      }),
    );

    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    expect(container.textContent).toContain('Worker');

    const rowDelete = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Delete',
    );
    expect(rowDelete).toBeTruthy();

    await act(async () => {
      rowDelete!.click();
    });

    const confirmDelete = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Delete node',
    );
    expect(confirmDelete).toBeTruthy();

    await act(async () => {
      confirmDelete!.click();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/nodes/node-1', {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    expect(container.textContent).toContain('No nodes have been registered yet');
  });
});
