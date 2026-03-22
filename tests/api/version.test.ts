import { describe, expect, test, vi } from 'vitest';

const mockSql = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/db', () => ({ sql: mockSql }));

import { GET } from '@/app/api/version/route';

describe('GET /api/version', () => {
  test('returns the database version row', async () => {
    mockSql.mockResolvedValue([{ version: 'PostgreSQL 15.0 on x86_64-pc-linux-gnu' }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.version).toContain('PostgreSQL');
  });
});
