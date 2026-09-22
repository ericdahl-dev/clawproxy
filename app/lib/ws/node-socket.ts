import type { RawData, WebSocket } from 'ws';

export type NodeSocketDeps = {
  authenticateToken: (token: string) => Promise<{ id: string } | null>;
  markSeen: (nodeId: string) => Promise<void>;
  pushPendingEvents: (ws: WebSocket, nodeId: string) => Promise<void>;
  handleAck: (ws: WebSocket, nodeId: string, eventIds: unknown) => Promise<void>;
  addConnection: (nodeId: string, ws: WebSocket) => void;
  removeConnection: (nodeId: string) => void;
  authTimeoutMs: number;
  /** How often to ping an authenticated node; a node that misses one ping is terminated. */
  pingIntervalMs: number;
  /** Minimum gap between last_seen_at writes for one connection. */
  seenThrottleMs: number;
};

export function createNodeSocketHandler(deps: NodeSocketDeps): (ws: WebSocket) => void {
  return function handleNodeWebSocket(ws: WebSocket): void {
    let nodeId: string | null = null;
    let authenticated = false;
    let alive = true;
    let lastSeenWriteMs = -Infinity;
    let pingTimer: NodeJS.Timeout | null = null;

    function touch(): void {
      if (!nodeId) return;
      const now = Date.now();
      if (now - lastSeenWriteMs < deps.seenThrottleMs) return;
      lastSeenWriteMs = now;
      const id = nodeId;
      deps.markSeen(id).catch((err: Error) => {
        console.error('[ws] Failed to mark node %s seen: %s', id, err.message);
      });
    }

    /** Push pending and lease-expired events. Runs at auth and on every keepalive tick, so a
     * delivery the node didn't ack is retried without waiting for a reconnect. */
    function pushPending(): void {
      if (!nodeId) return;
      const id = nodeId;
      deps.pushPendingEvents(ws, id).catch((err: Error) => {
        console.error('[ws] Failed to push pending events for node %s: %s', id, err.message);
      });
    }

    function stopPinging(): void {
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = null;
    }

    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        ws.close(4001, 'Authentication timeout');
      }
    }, deps.authTimeoutMs);

    ws.on('pong', () => {
      alive = true;
      touch();
    });

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
        const node = await deps.authenticateToken(msg.token);
        if (!node) {
          ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid or inactive node token' }));
          ws.close(4001, 'Unauthorized');
          return;
        }
        nodeId = node.id;
        authenticated = true;
        clearTimeout(authTimeout);
        deps.addConnection(nodeId, ws);
        touch();
        ws.send(JSON.stringify({ type: 'auth_ok', nodeId }));

        pingTimer = setInterval(() => {
          if (!alive) {
            stopPinging();
            ws.terminate();
            return;
          }
          alive = false;
          ws.ping();
          pushPending();
        }, deps.pingIntervalMs);

        pushPending();
        return;
      }

      if (msg.type === 'ack') {
        await deps.handleAck(ws, nodeId!, msg.eventIds);
        touch();
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
      stopPinging();
      if (nodeId) deps.removeConnection(nodeId);
    });

    ws.on('error', (err: Error) => {
      console.error('[ws] WebSocket error for node %s: %s', nodeId, err.message);
      if (nodeId) deps.removeConnection(nodeId);
    });
  };
}
