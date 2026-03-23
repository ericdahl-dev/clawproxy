import { beforeEach, describe, expect, test, vi } from 'vitest';

const getSpy = vi.hoisted(() => vi.fn());
const postSpy = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/auth/server', () => ({
  auth: {
    handler: vi.fn(() => ({
      GET: getSpy,
      POST: postSpy,
    })),
  },
}));

import { GET as rootGet, POST as rootPost } from '@/app/api/auth/route';
import { GET as catchAllGet, POST as catchAllPost } from '@/app/api/auth/[...path]/route';

describe('GET/POST /api/auth', () => {
  beforeEach(() => {
    getSpy.mockReset();
    postSpy.mockReset();
    getSpy.mockResolvedValue(new Response('ok-get', { status: 200 }));
    postSpy.mockResolvedValue(new Response('ok-post', { status: 200 }));
  });

  test('root route delegates to handler.GET with empty path params', async () => {
    const req = new Request('http://localhost/api/auth');
    const res = await rootGet(req);

    expect(getSpy).toHaveBeenCalledTimes(1);
    const [request, ctx] = getSpy.mock.calls[0]!;
    expect(request).toBe(req);
    expect(await ctx.params).toEqual({ path: [] });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok-get');
  });

  test('root route delegates to handler.POST with empty path params', async () => {
    const req = new Request('http://localhost/api/auth', { method: 'POST', body: '{}' });
    const res = await rootPost(req);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const [, ctx] = postSpy.mock.calls[0]!;
    expect(await ctx.params).toEqual({ path: [] });
    expect(res.status).toBe(200);
  });

  test('catch-all route exports the same handler methods', async () => {
    const req = new Request('http://localhost/api/auth/callback/foo');
    await catchAllGet(req);
    expect(getSpy).toHaveBeenCalled();

    const req2 = new Request('http://localhost/api/auth/callback/foo', { method: 'POST' });
    await catchAllPost(req2);
    expect(postSpy).toHaveBeenCalled();
  });
});
