import type { WebSocket } from 'ws';

// Persist WebSocket connections across Next.js webpack module boundaries.
// Route handlers are webpack-bundled in their own module registry, while
// server.ts runs in the Node.js module cache. Using global ensures both
// share a single connection map within the same server process.
declare global {
  var __clawproxyWsConnections: Map<string, WebSocket> | undefined;
}

if (!global.__clawproxyWsConnections) {
  global.__clawproxyWsConnections = new Map<string, WebSocket>();
}

function connections(): Map<string, WebSocket> {
  return global.__clawproxyWsConnections!;
}

export function addConnection(nodeId: string, ws: WebSocket): void {
  connections().set(nodeId, ws);
}

export function removeConnection(nodeId: string): void {
  connections().delete(nodeId);
}

export function isConnected(nodeId: string): boolean {
  const ws = connections().get(nodeId);
  if (!ws) return false;
  return ws.readyState === 1; // WebSocket.OPEN = 1
}

export function pushEventToNode(nodeId: string, data: object): boolean {
  const ws = connections().get(nodeId);
  if (!ws || ws.readyState !== 1) return false;
  ws.send(JSON.stringify(data));
  return true;
}
