import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockDb, mockDbSelectLimit, mockDbInsertReturning, mockDbUpdate } = vi.hoisted(() => {
  const mockDbSelectLimit = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ limit: mockDbSelectLimit });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ where: mockDbSelectWhere });

  const mockDbInsertReturning = vi.fn().mockResolvedValue([]);
  const mockDbInsertValues = vi.fn().mockReturnValue({ returning: mockDbInsertReturning });

  const mockDbUpdate = vi.fn().mockResolvedValue([]);
  const mockDbUpdateWhere = vi.fn().mockReturnValue({ returning: mockDbUpdate });
  const mockDbUpdateSet = vi.fn().mockReturnValue({ where: mockDbUpdateWhere });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
    insert: vi.fn().mockReturnValue({ values: mockDbInsertValues }),
    update: vi.fn().mockReturnValue({ set: mockDbUpdateSet }),
  };

  return { mockDb, mockDbSelectLimit, mockDbInsertReturning, mockDbUpdate };
});

const mockIsConnected = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockPushEventToNode = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));
vi.mock('@/app/lib/ws/connection-manager', () => ({
  isConnected: mockIsConnected,
  pushEventToNode: mockPushEventToNode,
}));
vi.mock('@/app/lib/crypto/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

import { POST } from '@/app/api/ingress/[userId]/[routeSlug]/route';

const mockRoute = {
  id: 'route-uuid-1',
  userId: 'user-1',
  nodeId: 'node-uuid-1',
  slug: 'my-webhook',
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(userId: string, slug: string, body = '{}', contentType = 'application/json') {
  return new Request(`http://localhost/api/ingress/${userId}/${slug}`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  });
}

function makeContext(userId: string, routeSlug: string) {
  return { params: Promise.resolve({ userId, routeSlug }) };
}

describe('POST /api/ingress/[userId]/[routeSlug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConnected.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  test('returns 404 when the route slug does not exist', async () => {
    mockDbSelectLimit.mockResolvedValue([]);

    const response = await POST(makeRequest('user-1', 'unknown-route'), makeContext('user-1', 'unknown-route'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not found/i);
  });

  test('returns 202 and the event id when the route exists', async () => {
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-uuid-1', status: 'pending' }]);

    const response = await POST(makeRequest('user-1', 'my-webhook', '{"key":"value"}'), makeContext('user-1', 'my-webhook'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.ok).toBe(true);
    expect(body.eventId).toBe('event-uuid-1');
    expect(body.status).toBe('pending');
  });

  test('stores the raw body text regardless of content type', async () => {
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-uuid-2', status: 'pending' }]);

    const rawBody = 'plain text payload';
    const response = await POST(makeRequest('user-1', 'my-webhook', rawBody, 'text/plain'), makeContext('user-1', 'my-webhook'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.ok).toBe(true);
    // Verify insert was called (values mock was invoked)
    expect(mockDb.insert).toHaveBeenCalled();
  });

  test('leases and pushes event via WebSocket when node is connected', async () => {
    mockIsConnected.mockReturnValue(true);
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-ws-1', status: 'pending' }]);

    const leasedEvent = {
      id: 'event-ws-1',
      routeId: 'route-uuid-1',
      headersJson: 'enc:{"x-custom":"value"}',
      bodyText: 'enc:{"ws":true}',
      contentType: 'application/json',
      receivedAt: new Date('2024-01-01T00:00:00Z'),
      leaseExpiresAt: new Date('2024-01-01T00:01:00Z'),
      attemptCount: 1,
    };
    mockDbUpdate.mockResolvedValue([leasedEvent]);

    const response = await POST(makeRequest('user-1', 'my-webhook', '{"ws":true}'), makeContext('user-1', 'my-webhook'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.ok).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockPushEventToNode).toHaveBeenCalledWith(
      'node-uuid-1',
      expect.objectContaining({
        type: 'event',
        id: 'event-ws-1',
        routeSlug: 'my-webhook',
      }),
    );
  });

  test('skips WebSocket push when node is not connected', async () => {
    mockIsConnected.mockReturnValue(false);
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-poll-1', status: 'pending' }]);

    await POST(makeRequest('user-1', 'my-webhook'), makeContext('user-1', 'my-webhook'));

    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockPushEventToNode).not.toHaveBeenCalled();
  });

  test('skips WebSocket push when lease update returns no rows', async () => {
    mockIsConnected.mockReturnValue(true);
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-race-1', status: 'pending' }]);
    mockDbUpdate.mockResolvedValue([]); // race: already leased by pull

    await POST(makeRequest('user-1', 'my-webhook'), makeContext('user-1', 'my-webhook'));

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockPushEventToNode).not.toHaveBeenCalled();
  });
});
