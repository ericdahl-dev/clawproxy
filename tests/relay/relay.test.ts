import { createHmac } from 'node:crypto';

import { afterEach, describe, expect, test, vi } from 'vitest';

import { httpPullAndForward, registerShutdown, type RelayConfig } from '@/relay';

const config: RelayConfig = {
  wsUrl: 'wss://clawproxy.test/api/nodes/ws',
  token: 'cpn_test',
  hermesWebhookUrl: 'http://hermes.test/webhook',
  hermesWebhookSecret: 'secret',
  httpFallback: {
    pullUrl: 'https://clawproxy.test/api/nodes/pull',
    ackUrl: 'https://clawproxy.test/api/nodes/ack',
    intervalSeconds: 30,
    maxEvents: 7,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('httpPullAndForward', () => {
  test('pulls with POST, the node token, and maxEvents', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, nodeId: 'n', events: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await httpPullAndForward(config);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(config.httpFallback.pullUrl);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer cpn_test');
    expect(JSON.parse(init.body as string)).toEqual({ maxEvents: 7 });
  });

  test('forwards events from the { events } response to Hermes, then acks them', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, nodeId: 'n', events: [{ id: 'evt-1', body: '{"a":1}' }] }),
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await httpPullAndForward(config);

    const [hermesUrl, hermesInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(hermesUrl).toBe(config.hermesWebhookUrl);
    expect(hermesInit.body).toBe('{"a":1}');
    const expectedSig = createHmac('sha256', 'secret').update('{"a":1}').digest('hex');
    expect((hermesInit.headers as Record<string, string>)['x-webhook-signature']).toBe(expectedSig);

    const [ackUrl, ackInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(ackUrl).toBe(config.httpFallback.ackUrl);
    expect(ackInit.method).toBe('POST');
    expect(JSON.parse(ackInit.body as string)).toEqual({ eventIds: ['evt-1'] });
  });
});

describe('registerShutdown', () => {
  test('handles SIGTERM (what systemd sends) as well as SIGINT', () => {
    const onSpy = vi.spyOn(process, 'on').mockImplementation(() => process);

    registerShutdown(() => {});

    const signals = onSpy.mock.calls.map(([event]) => event);
    expect(signals).toContain('SIGTERM');
    expect(signals).toContain('SIGINT');
  });
});
