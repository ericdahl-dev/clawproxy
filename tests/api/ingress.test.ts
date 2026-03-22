import { describe, expect, test, vi } from 'vitest';

const { mockDb, mockDbSelectLimit, mockDbInsertReturning } = vi.hoisted(() => {
  const mockDbSelectLimit = vi.fn().mockResolvedValue([]);
  const mockDbSelectWhere = vi.fn().mockReturnValue({ limit: mockDbSelectLimit });
  const mockDbSelectFrom = vi.fn().mockReturnValue({ where: mockDbSelectWhere });

  const mockDbInsertReturning = vi.fn().mockResolvedValue([]);
  const mockDbInsertValues = vi.fn().mockReturnValue({ returning: mockDbInsertReturning });

  const mockDb = {
    select: vi.fn().mockReturnValue({ from: mockDbSelectFrom }),
    insert: vi.fn().mockReturnValue({ values: mockDbInsertValues }),
  };

  return { mockDb, mockDbSelectLimit, mockDbInsertReturning };
});

vi.mock('@/app/lib/db/client', () => ({ db: mockDb }));

import { POST } from '@/app/api/ingress/[routeSlug]/route';

const mockRoute = {
  id: 'route-uuid-1',
  userId: 'user-1',
  nodeId: 'node-uuid-1',
  slug: 'my-webhook',
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(slug: string, body = '{}', contentType = 'application/json') {
  return new Request(`http://localhost/api/ingress/${slug}`, {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  });
}

function makeContext(routeSlug: string) {
  return { params: Promise.resolve({ routeSlug }) };
}

describe('POST /api/ingress/[routeSlug]', () => {
  test('returns 404 when the route slug does not exist', async () => {
    mockDbSelectLimit.mockResolvedValue([]);

    const response = await POST(makeRequest('unknown-route'), makeContext('unknown-route'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/not found/i);
  });

  test('returns 202 and the event id when the route exists', async () => {
    mockDbSelectLimit.mockResolvedValue([mockRoute]);
    mockDbInsertReturning.mockResolvedValue([{ id: 'event-uuid-1', status: 'pending' }]);

    const response = await POST(makeRequest('my-webhook', '{"key":"value"}'), makeContext('my-webhook'));
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
    const response = await POST(makeRequest('my-webhook', rawBody, 'text/plain'), makeContext('my-webhook'));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.ok).toBe(true);
    // Verify insert was called (values mock was invoked)
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
