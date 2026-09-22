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
        wsConnected: false,
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

    const confirmDelete = Array.from(document.body.querySelectorAll('button')).find(
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
    expect(container.textContent).toContain('No nodes yet');
  });

  test('keeps connect modal visible within the viewport', async () => {
    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    const connectButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Connect',
    );
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton!.click();
    });

    const modalTitle = Array.from(document.body.querySelectorAll('h3')).find(
      (h) => h.textContent?.trim() === 'Connect your node',
    );
    expect(modalTitle).toBeTruthy();

    const modalPanel = modalTitle?.closest('div');
    expect(modalPanel).toBeTruthy();
    expect(modalPanel?.className).toContain('max-h-[calc(100dvh-2rem)]');
    expect(modalPanel?.className).toContain('overflow-y-auto');
  });

  test('renders WS column with connected and disconnected states', async () => {
    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker A',
        slug: 'worker-a',
        status: 'active' as const,
        wsConnected: true,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'node-2',
        name: 'Worker B',
        slug: 'worker-b',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    expect(container.textContent).toContain('WS');
    expect(container.textContent).toContain('connected');
    expect(container.textContent).toContain('disconnected');
  });

  test('closes connect modal on Escape', async () => {
    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    const connectButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Connect',
    );
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton!.click();
    });

    expect(document.body.textContent).toContain('Connect your node');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(document.body.textContent).not.toContain('Connect your node');
  });

  test('closes connect modal on backdrop click', async () => {
    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    const connectButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Connect',
    );
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton!.click();
    });

    expect(document.body.textContent).toContain('Connect your node');

    const backdrop = document.body.querySelector('[data-testid="modal-backdrop"]');
    expect(backdrop).toBeTruthy();

    await act(async () => {
      backdrop!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(document.body.textContent).not.toContain('Connect your node');
  });

  test('shows the delivery-URL prompt and reuses the saved URL in the connect modal', async () => {
    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    expect(container.textContent).toContain('Where should events be delivered?');

    const urlInput = container.querySelector('#openclaw-base-url') as HTMLInputElement | null;
    expect(urlInput).toBeTruthy();

    const valueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    expect(valueSetter).toBeTruthy();

    await act(async () => {
      valueSetter!.call(urlInput, 'http://openclaw-host:8080');
      urlInput!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Save URL',
    );
    expect(saveButton).toBeTruthy();

    await act(async () => {
      saveButton!.click();
    });

    expect(window.localStorage.getItem('nodes.openclawBaseUrl')).toBe('http://openclaw-host:8080');

    const connectButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Connect',
    );
    expect(connectButton).toBeTruthy();

    await act(async () => {
      connectButton!.click();
    });

    const modalInput = document.body.querySelector('#openclaw-url') as HTMLInputElement | null;
    expect(modalInput).toBeTruthy();
    expect(modalInput?.value).toBe('http://openclaw-host:8080');
    expect(document.body.textContent).toContain('Any other agent — protocol setup block');
    expect(document.body.textContent).toContain(
      'After successful forward, send websocket ack using connection.websocket.ack_message_template',
    );
  });

  test('defaults OpenClaw base URL to local dev (127.0.0.1:18789) for new users', async () => {
    window.localStorage.removeItem('nodes.openclawBaseUrl');

    const initialNodes = [
      {
        id: 'node-1',
        name: 'Worker',
        slug: 'worker',
        status: 'active' as const,
        wsConnected: false,
        lastSeenAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ];

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes }));
    });

    const urlInput = container.querySelector('#openclaw-base-url') as HTMLInputElement | null;
    expect(urlInput).toBeTruthy();
    expect(urlInput?.value).toBe('http://127.0.0.1:18789');
  });
});

describe('NodesClient onboarding', () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('does not claim a delivery URL is saved when the user never saved one', async () => {
    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes: [] }));
    });

    expect(container.textContent).not.toContain('Saved:');
  });

  test('shows the saved delivery URL once one is stored', async () => {
    window.localStorage.setItem('nodes.openclawBaseUrl', 'http://127.0.0.1:9999');

    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes: [] }));
    });

    expect(container.textContent).toContain('Saved: http://127.0.0.1:9999');
  });

  test('an account with no nodes gets a create prompt, not just an empty line', async () => {
    await act(async () => {
      root.render(createElement(NodesClient, { initialNodes: [] }));
    });

    expect(container.textContent).toMatch(/create your first node/i);
  });
});
