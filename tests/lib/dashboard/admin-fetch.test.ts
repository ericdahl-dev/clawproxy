import { afterEach, describe, expect, test, vi } from 'vitest';

import { adminJson } from '@/app/lib/dashboard/admin-fetch';

describe('adminJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('calls fetch with credentials same-origin merged into init', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, items: [1] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await adminJson<{ ok: true; items: number[] }>('/api/admin/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/x',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
        credentials: 'same-origin',
      }),
    );
    expect(result).toEqual({ ok: true, data: { ok: true, items: [1] } });
  });

  test('returns ok true when HTTP 2xx and body ok true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true, foo: 'bar' }), { status: 200 }),
      ),
    );

    const result = await adminJson<{ ok: true; foo: string }>('/api/admin/y');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.foo).toBe('bar');
  });

  test('returns error when body ok false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, error: 'Nope' }), { status: 200 }),
      ),
    );

    const result = await adminJson('/api/admin/z');

    expect(result).toEqual({ ok: false, status: 200, error: 'Nope' });
  });

  test('returns error when HTTP not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, error: 'Missing' }), { status: 404 }),
      ),
    );

    const result = await adminJson('/api/admin/missing');

    expect(result).toEqual({ ok: false, status: 404, error: 'Missing' });
  });

  test('returns HTML hint when response is HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<!doctype html><html>', { status: 200 })),
    );

    const result = await adminJson('/api/admin/h');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(200);
      expect(result.error).toMatch(/html/i);
    }
  });

  test('returns error on fetch network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const result = await adminJson('/api/admin/n');

    expect(result).toEqual({ ok: false, status: 0, error: 'Failed to fetch' });
  });
});
