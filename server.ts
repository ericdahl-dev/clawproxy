import crypto from 'node:crypto';
import { createServer } from 'node:http';
import next from 'next';
import postgres from 'postgres';
import { WebSocketServer, type WebSocket, type RawData } from 'ws';

import { addConnection, removeConnection } from './app/lib/ws/connection-manager';
import type { WsEventPayload } from './app/lib/ws/protocol';

type AckResultRow = { id: string };

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);

const DEFAULT_LEASE_DURATION_SECONDS = 60;
const AUTH_TIMEOUT_MS = 10_000;
const WS_PATH = '/api/nodes/ws';

function createDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { ssl: 'require' });
}

const db = createDb();

function hashNodeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function validateAckEventIds(eventIds: unknown): string[] {
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    throw new Error('eventIds are required');
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of eventIds) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error('eventIds must be non-empty strings');
    }
    const trimmed = id.trim();
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

async function authenticateToken(token: string): Promise<{ id: string } | null> {
  const tokenHash = hashNodeToken(token);
  const rows = await db`
    SELECT id, status FROM nodes WHERE token_hash = ${tokenHash} LIMIT 1
  `;
  const node = rows[0] as { id: string; status: string } | undefined;
  if (!node || node.status !== 'active') return null;
  return { id: node.id };
}

const DEFAULT_MAX_RETRY_ATTEMPTS = 5;

async function pushPendingEventsForNode(ws: WebSocket, nodeId: string): Promise<void> {
  const rows = await db`
    WITH candidates AS (
      SELECT e.id
      FROM events e
      WHERE e.node_id = ${nodeId}
        AND e.expires_at > now()
        AND e.attempt_count < ${DEFAULT_MAX_RETRY_ATTEMPTS}
        AND (
          e.status = 'pending'
          OR (e.status = 'leased' AND e.lease_expires_at <= now())
        )
      ORDER BY e.received_at ASC
    )
    UPDATE events e
    SET
      status = 'leased',
      lease_expires_at = now() + (${DEFAULT_LEASE_DURATION_SECONDS} * interval '1 second'),
      attempt_count = e.attempt_count + 1,
      updated_at = now()
    FROM candidates c
    WHERE e.id = c.id
    RETURNING
      e.id,
      e.route_id AS "routeId",
      (SELECT r.slug FROM routes r WHERE r.id = e.route_id) AS "routeSlug",
      e.headers_json AS headers,
      e.body_text AS body,
      e.content_type AS "contentType",
      e.received_at::text AS "receivedAt",
      e.lease_expires_at::text AS "leaseExpiresAt",
      e.attempt_count AS "attemptCount"
  `;
  for (const event of rows as WsEventPayload[]) {    ws.send(JSON.stringify({ type: 'event', ...event }));
  }
}

async function handleAck(ws: WebSocket, nodeId: string, eventIds: unknown): Promise<void> {
  let validated: string[];
  try {
    validated = validateAckEventIds(eventIds);
  } catch (err) {
    ws.send(JSON.stringify({ type: 'ack_error', error: (err as Error).message }));
    return;
  }

  const rows = await db`
    UPDATE events
    SET
      status = 'delivered',
      acked_at = now(),
      updated_at = now()
    WHERE node_id = ${nodeId}
      AND status = 'leased'
      AND id IN ${db(validated)}
    RETURNING id
  `;
  const ackedIds = (rows as AckResultRow[]).map((r) => r.id);
  ws.send(JSON.stringify({ type: 'ack_ok', acked: ackedIds.length, eventIds: ackedIds }));
}

function handleNodeWebSocket(ws: WebSocket): void {
  let nodeId: string | null = null;
  let authenticated = false;

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.close(4001, 'Authentication timeout');
    }
  }, AUTH_TIMEOUT_MS);

  ws.on('message', async (raw: RawData) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      ws.close(4000, 'Invalid JSON');
      return;
    }

    if (!authenticated) {
      if (msg.type !== 'auth' || typeof msg.token !== 'string') {
        ws.send(JSON.stringify({ type: 'auth_error', error: 'Send auth message first' }));
        return;
      }
      const node = await authenticateToken(msg.token);
      if (!node) {
        ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid or inactive node token' }));
        ws.close(4001, 'Unauthorized');
        return;
      }
      nodeId = node.id;
      authenticated = true;
      clearTimeout(authTimeout);
      addConnection(nodeId, ws);
      ws.send(JSON.stringify({ type: 'auth_ok', nodeId }));
      pushPendingEventsForNode(ws, nodeId).catch((err: Error) => {
        console.error('[ws] Failed to push pending events for node %s: %s', nodeId, err.message);
      });
      return;
    }

    if (msg.type === 'ack') {
      await handleAck(ws, nodeId!, msg.eventIds);
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);
    if (nodeId) removeConnection(nodeId);
  });

  ws.on('error', (err: Error) => {
    console.error('[ws] WebSocket error for node %s: %s', nodeId, err.message);
    if (nodeId) removeConnection(nodeId);
  });
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', handleNodeWebSocket);

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname === WS_PATH) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
