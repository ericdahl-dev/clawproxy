import crypto from 'node:crypto';
import { createServer } from 'node:http';
import next from 'next';
import postgres from 'postgres';
import { WebSocketServer, type WebSocket } from 'ws';

import { applyCommittedMigrations } from './app/lib/db/migrations';
import { markNodeSeen } from './app/lib/nodes/mark-seen';
import { addConnection, removeConnection } from './app/lib/ws/connection-manager';
import { createNodeSocketHandler } from './app/lib/ws/node-socket';
import type { WsEventPayload } from './app/lib/ws/protocol';

type AckResultRow = { id: string };

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME ?? '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);

const DEFAULT_LEASE_DURATION_SECONDS = 60;
const AUTH_TIMEOUT_MS = 10_000;
const PING_INTERVAL_MS = 30_000;
const SEEN_THROTTLE_MS = 60_000;
const WS_PATH = '/api/nodes/ws';

function sslMode(): 'require' | false {
  const mode = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (mode === 'disable' || mode === 'false') return false;
  return 'require';
}

function createDb() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { ssl: sslMode() });
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
  const rows = await db<AckResultRow[]>`
    SELECT id, status FROM nodes WHERE token_hash = ${tokenHash} LIMIT 1
  `;
  const node = rows[0] as { id: string; status: string } | undefined;
  if (!node || node.status !== 'active') return null;
  return { id: node.id };
}

const DEFAULT_MAX_RETRY_ATTEMPTS = 5;

async function pushPendingEventsForNode(ws: WebSocket, nodeId: string): Promise<void> {
  const rows = await db<WsEventPayload[]>`
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
  for (const event of rows) {
    ws.send(JSON.stringify({ type: 'event', ...event }));
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
  const ackedIds = rows.map((r) => r.id);
  ws.send(JSON.stringify({ type: 'ack_ok', acked: ackedIds.length, eventIds: ackedIds }));
}

const handleNodeWebSocket = createNodeSocketHandler({
  authenticateToken,
  markSeen: (nodeId) => markNodeSeen(db, nodeId),
  pushPendingEvents: pushPendingEventsForNode,
  handleAck,
  addConnection,
  removeConnection,
  authTimeoutMs: AUTH_TIMEOUT_MS,
  pingIntervalMs: PING_INTERVAL_MS,
  seenThrottleMs: SEEN_THROTTLE_MS,
});

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await applyCommittedMigrations(db);
  await app.prepare();

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
}

main().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
