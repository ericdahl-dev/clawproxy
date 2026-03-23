import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mockSend = vi.fn();
const mockWs = (readyState: number = 1) =>
  ({ readyState, send: mockSend }) as unknown as import('ws').WebSocket;

describe('connection-manager', () => {
  beforeEach(() => {
    // Reset global connections before each test
    global.__clawproxyWsConnections = new Map();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  test('addConnection stores a WebSocket for a nodeId', async () => {
    const { addConnection, isConnected } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const ws = mockWs();
    addConnection('node-1', ws);
    expect(isConnected('node-1')).toBe(true);
  });

  test('removeConnection removes the WebSocket for a nodeId', async () => {
    const { addConnection, removeConnection, isConnected } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const ws = mockWs();
    addConnection('node-1', ws);
    removeConnection('node-1');
    expect(isConnected('node-1')).toBe(false);
  });

  test('isConnected returns false for unknown nodeId', async () => {
    const { isConnected } = await import('@/app/lib/ws/connection-manager');
    expect(isConnected('unknown')).toBe(false);
  });

  test('isConnected returns false when WebSocket readyState is not OPEN', async () => {
    const { addConnection, isConnected } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const closedWs = mockWs(3); // readyState 3 = CLOSED
    addConnection('node-1', closedWs);
    expect(isConnected('node-1')).toBe(false);
  });

  test('pushEventToNode sends serialised data to the WebSocket', async () => {
    const { addConnection, pushEventToNode } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const ws = mockWs();
    addConnection('node-1', ws);

    const data = { type: 'event', id: 'evt-1' };
    const sent = pushEventToNode('node-1', data);

    expect(sent).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(JSON.stringify(data));
  });

  test('pushEventToNode returns false for unknown nodeId', async () => {
    const { pushEventToNode } = await import('@/app/lib/ws/connection-manager');
    const sent = pushEventToNode('missing', { type: 'event' });
    expect(sent).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('pushEventToNode returns false when WebSocket is not open', async () => {
    const { addConnection, pushEventToNode } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const closedWs = mockWs(3);
    addConnection('node-1', closedWs);

    const sent = pushEventToNode('node-1', { type: 'event' });
    expect(sent).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test('global map is initialised on first import if not present', async () => {
    global.__clawproxyWsConnections = undefined;
    await import('@/app/lib/ws/connection-manager');
    expect(global.__clawproxyWsConnections).toBeInstanceOf(Map);
  });

  test('addConnection replaces an existing connection for the same nodeId', async () => {
    const { addConnection, pushEventToNode } = await import(
      '@/app/lib/ws/connection-manager'
    );
    const firstSend = vi.fn();
    const secondSend = vi.fn();

    const ws1 = { readyState: 1, send: firstSend } as unknown as import('ws').WebSocket;
    const ws2 = { readyState: 1, send: secondSend } as unknown as import('ws').WebSocket;

    addConnection('node-1', ws1);
    addConnection('node-1', ws2);

    pushEventToNode('node-1', { type: 'event' });

    expect(firstSend).not.toHaveBeenCalled();
    expect(secondSend).toHaveBeenCalledOnce();
  });
});
