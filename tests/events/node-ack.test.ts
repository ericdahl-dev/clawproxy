import { describe, expect, test } from 'vitest';

import {
  validateAckEventIds,
  buildAckSql,
  type AckUpdateRow,
  summarizeAckedEvents,
} from '@/app/lib/events/ack';

describe('node ack helpers', () => {
  test('validateAckEventIds rejects empty or invalid payloads', () => {
    expect(() => validateAckEventIds([])).toThrow('eventIds are required');
    expect(() => validateAckEventIds([''])).toThrow('eventIds must be non-empty strings');
    expect(() => validateAckEventIds(['evt_1', '   '])).toThrow('eventIds must be non-empty strings');
  });

  test('validateAckEventIds trims values and preserves order', () => {
    expect(validateAckEventIds([' evt_1 ', 'evt_2'])).toEqual(['evt_1', 'evt_2']);
  });

  test('buildAckSql scopes updates to leased events for the authenticated node', () => {
    const sql = buildAckSql('node_1', ['evt_1', 'evt_2']);

    expect(sql).toContain("status = 'delivered'");
    expect(sql).toContain('acked_at = now()');
    expect(sql).toContain("WHERE node_id = 'node_1'");
    expect(sql).toContain("AND status = 'leased'");
    expect(sql).toContain("id IN ('evt_1', 'evt_2')");
    expect(sql).toContain('RETURNING id');
  });

  test('summarizeAckedEvents returns ack count and ids', () => {
    const rows: AckUpdateRow[] = [{ id: 'evt_1' }, { id: 'evt_2' }];

    expect(summarizeAckedEvents(rows)).toEqual({
      acked: 2,
      eventIds: ['evt_1', 'evt_2'],
    });
  });
});
