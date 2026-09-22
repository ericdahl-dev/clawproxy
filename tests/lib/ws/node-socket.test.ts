import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createNodeSocketHandler, type NodeSocketDeps } from '@/app/lib/ws/node-socket';

class FakeSocket extends EventEmitter {
  send = vi.fn();
  close = vi.fn();
  ping = vi.fn();
  terminate = vi.fn();

  receive(msg: unknown) {
    this.emit('message', Buffer.from(JSON.stringify(msg)));
  }
}

const PING_MS = 30_000;
const THROTTLE_MS = 60_000;

function setup(overrides: Partial<NodeSocketDeps> = {}) {
  const deps: NodeSocketDeps = {
    authenticateToken: vi.fn().mockResolvedValue({ id: 'node-1' }),
    markSeen: vi.fn().mockResolvedValue(undefined),
    pushPendingEvents: vi.fn().mockResolvedValue(undefined),
    handleAck: vi.fn().mockResolvedValue(undefined),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
    authTimeoutMs: 10_000,
    pingIntervalMs: PING_MS,
    seenThrottleMs: THROTTLE_MS,
    ...overrides,
  };
  const ws = new FakeSocket();
  createNodeSocketHandler(deps)(ws as never);
  return { deps, ws };
}

async function authenticate(ws: FakeSocket) {
  ws.receive({ type: 'auth', token: 'cpn_valid' });
  await vi.advanceTimersByTimeAsync(0);
}

describe('createNodeSocketHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('marks the node seen when it authenticates', async () => {
    const { deps, ws } = setup();

    await authenticate(ws);

    expect(deps.markSeen).toHaveBeenCalledWith('node-1');
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_ok', nodeId: 'node-1' }));
    expect(deps.addConnection).toHaveBeenCalledWith('node-1', ws);
  });

  test('does not mark anything seen when the token is invalid', async () => {
    const { deps, ws } = setup({ authenticateToken: vi.fn().mockResolvedValue(null) });

    await authenticate(ws);

    expect(deps.markSeen).not.toHaveBeenCalled();
    expect(ws.close).toHaveBeenCalledWith(4001, 'Unauthorized');
  });

  test('still completes auth if marking the node seen fails', async () => {
    const { ws } = setup({ markSeen: vi.fn().mockRejectedValue(new Error('db down')) });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await authenticate(ws);

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_ok', nodeId: 'node-1' }));
    errorSpy.mockRestore();
  });

  test('pings the node on an interval once authenticated', async () => {
    const { ws } = setup();

    await vi.advanceTimersByTimeAsync(PING_MS);
    expect(ws.ping).not.toHaveBeenCalled();

    await authenticate(ws);
    await vi.advanceTimersByTimeAsync(PING_MS);
    expect(ws.ping).toHaveBeenCalledTimes(1);
  });

  test('refreshes last seen on pong, at most once per throttle window', async () => {
    const { deps, ws } = setup();
    await authenticate(ws);
    expect(deps.markSeen).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(PING_MS);
    ws.emit('pong');
    expect(deps.markSeen).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(PING_MS);
    ws.emit('pong');
    expect(deps.markSeen).toHaveBeenCalledTimes(2);
  });

  test('terminates a node that stops answering pings', async () => {
    const { ws } = setup();
    await authenticate(ws);

    await vi.advanceTimersByTimeAsync(PING_MS);
    expect(ws.terminate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(PING_MS);
    expect(ws.terminate).toHaveBeenCalledTimes(1);
  });

  test('marks the node seen on ack, respecting the throttle', async () => {
    const { deps, ws } = setup();
    await authenticate(ws);

    ws.receive({ type: 'ack', eventIds: ['evt-1'] });
    await vi.advanceTimersByTimeAsync(0);
    expect(deps.handleAck).toHaveBeenCalledWith(ws, 'node-1', ['evt-1']);
    expect(deps.markSeen).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(THROTTLE_MS);
    ws.emit('pong');
    ws.receive({ type: 'ack', eventIds: ['evt-2'] });
    await vi.advanceTimersByTimeAsync(0);
    expect(deps.markSeen).toHaveBeenCalledTimes(2);
  });

  test('stops pinging and removes the connection on close', async () => {
    const { deps, ws } = setup();
    await authenticate(ws);

    ws.emit('close');
    await vi.advanceTimersByTimeAsync(PING_MS * 3);

    expect(deps.removeConnection).toHaveBeenCalledWith('node-1');
    expect(ws.ping).not.toHaveBeenCalled();
    expect(ws.terminate).not.toHaveBeenCalled();
  });
});
