import { describe, expect, test, vi } from 'vitest';

import { markNodeSeen } from '@/app/lib/nodes/mark-seen';

describe('markNodeSeen', () => {
  test('updates last_seen_at for the given node', async () => {
    const sql = vi.fn().mockResolvedValue([]);

    await markNodeSeen(sql as never, 'node-1');

    expect(sql).toHaveBeenCalledTimes(1);
    const [strings, ...values] = sql.mock.calls[0] as [TemplateStringsArray, ...unknown[]];
    const query = strings.join('?');
    expect(query).toMatch(/UPDATE nodes/);
    expect(query).toMatch(/last_seen_at = now\(\)/);
    expect(values).toEqual(['node-1']);
  });
});
