import { describe, expect, test, vi } from 'vitest';

const { mockDbSelect, mockDbLimit } = vi.hoisted(() => {
  const mockDbLimit = vi.fn().mockResolvedValue([]);
  const mockDbWhere = vi.fn().mockReturnValue({ limit: mockDbLimit });
  const mockDbFrom = vi.fn().mockReturnValue({ where: mockDbWhere });
  const mockDbSelect = vi.fn().mockReturnValue({ from: mockDbFrom });
  return { mockDbSelect, mockDbLimit };
});

vi.mock('@/app/lib/db/client', () => ({
  db: { select: mockDbSelect },
}));

import { requireNodeFromRequest } from '@/app/lib/auth/require-node';

const activeNode = {
  id: 'node-uuid-1',
  userId: 'user-1',
  name: 'My Node',
  slug: 'my-node',
  tokenHash: 'hash',
  status: 'active' as const,
  lastSeenAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('requireNodeFromRequest', () => {
  test('throws when the Authorization header is missing', async () => {
    const request = new Request('http://localhost/', { method: 'POST' });

    await expect(requireNodeFromRequest(request)).rejects.toThrow(
      'Missing or invalid Authorization header'
    );
  });

  test('throws when the Authorization header is not a Bearer token', async () => {
    const request = new Request('http://localhost/', {
      method: 'POST',
      headers: { authorization: 'Basic dXNlcjpwYXNz' },
    });

    await expect(requireNodeFromRequest(request)).rejects.toThrow(
      'Missing or invalid Authorization header'
    );
  });

  test('throws when no node matches the token hash', async () => {
    mockDbLimit.mockResolvedValue([]);
    const request = new Request('http://localhost/', {
      method: 'POST',
      headers: { authorization: 'Bearer cpn_unknowntoken' },
    });

    await expect(requireNodeFromRequest(request)).rejects.toThrow('Invalid node token');
  });

  test('throws when the matched node is disabled', async () => {
    mockDbLimit.mockResolvedValue([{ ...activeNode, status: 'disabled' }]);
    const request = new Request('http://localhost/', {
      method: 'POST',
      headers: { authorization: 'Bearer cpn_validtoken' },
    });

    await expect(requireNodeFromRequest(request)).rejects.toThrow('Node is disabled');
  });

  test('returns the node when the token is valid and the node is active', async () => {
    mockDbLimit.mockResolvedValue([activeNode]);
    const request = new Request('http://localhost/', {
      method: 'POST',
      headers: { authorization: 'Bearer cpn_validtoken' },
    });

    const result = await requireNodeFromRequest(request);

    expect(result).toEqual(activeNode);
  });
});
