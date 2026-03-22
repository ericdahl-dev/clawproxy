import { beforeEach, describe, expect, test, vi } from 'vitest';

const { MockAuthError, mockRequireNodeFromRequest } = vi.hoisted(() => {
  class MockAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  }

  return {
    MockAuthError,
    mockRequireNodeFromRequest: vi.fn(),
  };
});

const mockSql = vi.hoisted(() => vi.fn().mockResolvedValue([]));

vi.mock('@/app/lib/auth/require-node', () => ({
  AuthError: MockAuthError,
  requireNodeFromRequest: mockRequireNodeFromRequest,
}));

vi.mock('@/app/lib/db', () => ({ sql: mockSql }));

import { POST } from '@/app/api/nodes/ack/route';

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
  return new Request('http://localhost/api/nodes/ack', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/nodes/ack', () => {
  beforeEach(() => {
    mockRequireNodeFromRequest.mockReset();
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  test('returns 401 when the node token is invalid', async () => {
    mockRequireNodeFromRequest.mockRejectedValue(new MockAuthError('Invalid node token'));

    const response = await POST(makeRequest({ eventIds: ['event-1'] }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Invalid node token');
  });

  test('returns 401 when the node is disabled', async () => {
    mockRequireNodeFromRequest.mockRejectedValue(new MockAuthError('Node is disabled'));

    const response = await POST(makeRequest({ eventIds: ['event-1'] }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Node is disabled');
  });

  test('returns 400 when eventIds is missing', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);

    const response = await POST(makeRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/eventIds are required/i);
  });

  test('returns 400 when eventIds is not an array', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);

    const response = await POST(makeRequest({ eventIds: 'not-an-array' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  test('returns 400 when eventIds contains empty strings', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);

    const response = await POST(makeRequest({ eventIds: [''] }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  test('returns 200 with acked count and ids when events are acknowledged', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    mockSql.mockResolvedValue([{ id: 'event-uuid-1' }, { id: 'event-uuid-2' }]);

    const response = await POST(makeRequest({ eventIds: ['event-uuid-1', 'event-uuid-2'] }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.acked).toBe(2);
    expect(body.eventIds).toEqual(['event-uuid-1', 'event-uuid-2']);
  });

  test('returns 200 with zero acked when no events matched', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    mockSql.mockResolvedValue([]);

    const response = await POST(makeRequest({ eventIds: ['unknown-event-id'] }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.acked).toBe(0);
    expect(body.eventIds).toEqual([]);
  });

  test('deduplicates eventIds before updating', async () => {
    mockRequireNodeFromRequest.mockResolvedValue(activeNode);
    mockSql.mockResolvedValue([{ id: 'event-uuid-1' }]);

    const response = await POST(
      makeRequest({ eventIds: ['event-uuid-1', 'event-uuid-1', 'event-uuid-1'] }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.acked).toBe(1);
    expect(body.eventIds).toEqual(['event-uuid-1']);
  });

  test('returns 500 when an unexpected error occurs', async () => {
    mockRequireNodeFromRequest.mockRejectedValue(new Error('Database connection failed'));

    const response = await POST(makeRequest({ eventIds: ['event-1'] }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
