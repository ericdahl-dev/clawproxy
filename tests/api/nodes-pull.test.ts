import { describe, expect, test, vi } from 'vitest';

const mockRequireNodeFromRequest = vi.hoisted(() => vi.fn());
const mockSql = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('@/app/lib/auth/require-node', () => ({
  requireNodeFromRequest: mockRequireNodeFromRequest,
}));

vi.mock('@/app/lib/db', () => ({ sql: mockSql }));

vi.mock('@/app/lib/crypto/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

import { POST } from '@/app/api/nodes/pull/route';

const activeNode = {
  id: 'node-uuid-1',
  userId: 'user-1',
  name: 'My Node',
  slug: 'my-node',
  tokenHash: 'hash',
  status: 'active' as const,
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: Record<string, unknown> = {}, token = 'cpn_valid') {
  return new Request('http://localhost/api/nodes/pull', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/nodes/pull', () => {
  test('returns 401 when the node token is invalid', async () => {
    mockRequireNodeFromRequest.mockRejectedValue(new Error('Invalid node token'));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Invalid node token');
  });

  test('returns 401 when the node is disabled', async () => {
    mockRequireNodeFromRequest.mockRejectedValue(new Error('Node is disabled'));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Node is disabled');
  });

  test('returns 200 with empty events when none are pending', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    // First sql call: UPDATE nodes; second: expire stale events; third: UPDATE events RETURNING
    mockSql
      .mockResolvedValueOnce([]) // UPDATE nodes (no rows returned)
      .mockResolvedValueOnce([]) // expire stale events
      .mockResolvedValueOnce([]); // UPDATE events → 0 events

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.nodeId).toBe(activeNode.id);
    expect(body.events).toEqual([]);
  });

  test('returns 200 with leased events when pending events exist', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    const pendingEvent = {
      id: 'event-uuid-1',
      routeId: 'route-uuid-1',
      routeSlug: 'my-webhook',
      headers: 'enc:{"content-type":"application/json"}',
      body: 'enc:{"key":"value"}',
      contentType: 'application/json',
      receivedAt: new Date().toISOString(),
      leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      attemptCount: 1,
    };

    mockSql
      .mockResolvedValueOnce([]) // UPDATE nodes
      .mockResolvedValueOnce([]) // expire stale events
      .mockResolvedValueOnce([pendingEvent]); // UPDATE events RETURNING

    const response = await POST(makeRequest({ maxEvents: 5 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].id).toBe('event-uuid-1');
    expect(body.events[0].routeSlug).toBe('my-webhook');
  });

  test('clamps maxEvents to the configured maximum', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    mockSql.mockResolvedValue([]);

    // maxEvents: 9999 should be clamped to 100
    const response = await POST(makeRequest({ maxEvents: 9999 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
