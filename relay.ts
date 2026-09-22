import { createHmac } from 'node:crypto';
import { WebSocket } from 'ws';

interface RelayConfig {
  wsUrl: string;
  token: string;
  hermesWebhookUrl: string;
  hermesWebhookSecret: string;
  httpFallback: {
    pullUrl: string;
    ackUrl: string;
    intervalSeconds: number;
    maxEvents: number;
  };
}

function loadConfig(): RelayConfig {
  const token = process.env.CLAWPROXY_RELAY_TOKEN ?? '';
  if (!token) throw new Error('CLAWPROXY_RELAY_TOKEN is required');

  return {
    wsUrl: 'wss://clawproxy.io/api/nodes/ws',
    token,
    hermesWebhookUrl: process.env.CLAWPROXY_RELAY_HERMES_WEBHOOK_URL ?? 'http://127.0.0.1:8644/webhooks/discord-approval',
    hermesWebhookSecret: process.env.CLAWPROXY_RELAY_HERMES_WEBHOOK_SECRET ?? '',
    httpFallback: {
      pullUrl: process.env.CLAWPROXY_RELAY_PULL_URL ?? 'https://clawproxy.io/api/nodes/pull',
      ackUrl: process.env.CLAWPROXY_RELAY_ACK_URL ?? 'https://clawproxy.io/api/nodes/ack',
      intervalSeconds: parseInt(process.env.CLAWPROXY_RELAY_INTERVAL_SECONDS ?? '30', 10),
      maxEvents: parseInt(process.env.CLAWPROXY_RELAY_MAX_EVENTS ?? '10', 10),
    },
  };
}

function signHermesPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

async function forwardToHermes(args: {
  url: string;
  secret: string;
  body: string;
}): Promise<{ ok: boolean; status: number; responseBody: string }> {
  const signature = signHermesPayload(args.body, args.secret);
  const res = await fetch(args.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
    },
    body: args.body,
  });
  const responseBody = await res.text();
  return { ok: res.ok, status: res.status, responseBody };
}

async function httpPullAndForward(config: RelayConfig): Promise<void> {
  try {
    const pullRes = await fetch(config.httpFallback.pullUrl, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${config.token}`,
      },
    });

    if (!pullRes.ok) {
      console.error('[relay] HTTP pull failed:', pullRes.status, await pullRes.text());
      return;
    }

    const events = (await pullRes.json()) as Array<{ id: string; body: string; contentType?: string }>;
    if (!Array.isArray(events) || events.length === 0) return;

    const ackedIds: string[] = [];

    for (const event of events.slice(0, config.httpFallback.maxEvents)) {
      const body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
      const result = await forwardToHermes({
        url: config.hermesWebhookUrl,
        secret: config.hermesWebhookSecret,
        body,
      });

      if (result.ok) {
        ackedIds.push(event.id);
        console.log('[relay] Forwarded + acked event', event.id, 'status', result.status);
      } else {
        console.error('[relay] Forward failed for event', event.id, 'status', result.status, result.responseBody);
      }
    }

    if (ackedIds.length > 0) {
      const ackRes = await fetch(config.httpFallback.ackUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ eventIds: ackedIds }),
      });

      if (!ackRes.ok) {
        console.error('[relay] HTTP ack failed:', ackRes.status, await ackRes.text());
      }
    }
  } catch (err) {
    console.error('[relay] HTTP fallback error:', (err as Error).message);
  }
}

function startWebSocketRelay(config: RelayConfig): void {
  let ws: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let httpFallbackTimer: NodeJS.Timeout | null = null;
  let connected = false;

  function connect() {
    console.log('[relay] Connecting to', config.wsUrl);
    ws = new WebSocket(config.wsUrl);

    ws.on('open', () => {
      console.log('[relay] WebSocket open, sending auth');
      connected = true;
      ws?.send(JSON.stringify({ type: 'auth', token: config.token }));

      // Stop HTTP fallback while WS is connected
      if (httpFallbackTimer) {
        clearInterval(httpFallbackTimer);
        httpFallbackTimer = null;
      }
    });

    ws.on('message', async (data: Buffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(data.toString()) as Record<string, unknown>;
      } catch {
        console.error('[relay] Invalid JSON from server');
        return;
      }

      if (msg.type === 'auth_ok') {
        console.log('[relay] Auth ok, nodeId:', msg.nodeId);
        return;
      }

      if (msg.type === 'auth_error') {
        console.error('[relay] Auth error:', msg.error);
        ws?.close();
        return;
      }

      if (msg.type === 'event') {
        const eventId = String(msg.id ?? '');
        const body = typeof msg.body === 'string' ? msg.body : JSON.stringify(msg.body);

        const result = await forwardToHermes({
          url: config.hermesWebhookUrl,
          secret: config.hermesWebhookSecret,
          body,
        });

        if (result.ok) {
          ws?.send(JSON.stringify({ type: 'ack', eventIds: [eventId] }));
          console.log('[relay] Forwarded + acked event', eventId, 'status', result.status);
        } else {
          console.error('[relay] Forward failed for event', eventId, 'status', result.status, result.responseBody);
        }
        return;
      }

      if (msg.type === 'ack_ok') {
        console.log('[relay] Server acked', msg.acked, 'events');
        return;
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      console.log('[relay] WebSocket closed:', code, reason.toString());
      connected = false;
      ws = null;

      // Start HTTP fallback
      if (!httpFallbackTimer) {
        httpFallbackTimer = setInterval(() => {
          if (!connected) httpPullAndForward(config);
        }, config.httpFallback.intervalSeconds * 1000);
      }

      // Reconnect after delay
      reconnectTimer = setTimeout(() => connect(), 5000);
    });

    ws.on('error', (err: Error) => {
      console.error('[relay] WebSocket error:', err.message);
    });
  }

  connect();

  // Also start HTTP fallback immediately in case WS never connects
  httpFallbackTimer = setInterval(() => {
    if (!connected) httpPullAndForward(config);
  }, config.httpFallback.intervalSeconds * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('[relay] Shutting down...');
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (httpFallbackTimer) clearInterval(httpFallbackTimer);
    ws?.close();
    process.exit(0);
  });
}

async function main() {
  const config = loadConfig();
  console.log('[relay] Starting clawproxy relay');
  console.log('[relay] Hermes webhook:', config.hermesWebhookUrl);
  console.log('[relay] HMAC secret configured:', config.hermesWebhookSecret ? 'yes' : 'NO - forwarding will fail if Hermes requires auth');
  startWebSocketRelay(config);
}

main().catch((err) => {
  console.error('[relay] Fatal error:', err);
  process.exit(1);
});
