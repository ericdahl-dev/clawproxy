// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { EventsClient } from '@/app/dashboard/events/events-client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const baseEvent = {
  nodeId: 'n1',
  nodeName: 'Alpha',
  routeId: 'r1',
  contentType: 'application/json',
  receivedAt: '2025-06-01T10:00:00.000Z',
  leaseExpiresAt: null as string | null,
  attemptCount: 1,
  ackedAt: null as string | null,
  expiresAt: '2025-06-02T10:00:00.000Z',
  createdAt: '2025-06-01T09:00:00.000Z',
};

describe('EventsClient', () => {
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

  test('refetches when a status filter is toggled', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      expect(url).toContain('/api/admin/events?');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            ok: true,
            events: [
              {
                ...baseEvent,
                id: 'fetched-1',
                nodeName: 'Beta',
                status: 'pending',
              },
            ],
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
      );
    });

    const initialEvents = [
      {
        ...baseEvent,
        id: 'initial-1',
        status: 'delivered' as const,
      },
    ];

    await act(async () => {
      root.render(
        createElement(EventsClient, {
          initialEvents,
          availableNodes: [],
        }),
      );
    });

    expect(container.textContent).toContain('Alpha');

    const pendingBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'pending',
    );
    expect(pendingBtn).toBeTruthy();

    await act(async () => {
      pendingBtn!.click();
    });

    expect(fetchMock).toHaveBeenCalled();
    expect(container.textContent).toContain('Beta');
    expect(container.textContent).not.toContain('Alpha');
  });

  test('shows fetch error when the list API returns not ok', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: 'nope' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await act(async () => {
      root.render(
        createElement(EventsClient, {
          initialEvents: [
            {
              ...baseEvent,
              id: 'e1',
              status: 'delivered' as const,
            },
          ],
          availableNodes: [],
        }),
      );
    });

    const failedBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'failed',
    );

    await act(async () => {
      failedBtn!.click();
    });

    expect(container.textContent).toContain('nope');
  });
});
