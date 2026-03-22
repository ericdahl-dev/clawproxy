import { describe, expect, test } from 'vitest';

import {
  AckValidationError,
  validateAckEventIds,
  type AckUpdateRow,
  summarizeAckedEvents,
} from '@/app/lib/events/ack';

describe('node ack helpers', () => {
  test('validateAckEventIds rejects empty or invalid payloads', () => {
    expect(() => validateAckEventIds([])).toThrow(AckValidationError);
    expect(() => validateAckEventIds([''])).toThrow(AckValidationError);
    expect(() => validateAckEventIds(['evt_1', '   '])).toThrow(AckValidationError);
  });

  test('validateAckEventIds trims values and preserves order', () => {
    expect(validateAckEventIds([' evt_1 ', 'evt_2'])).toEqual(['evt_1', 'evt_2']);
  });

  test('validateAckEventIds de-duplicates while preserving first-seen order', () => {
    expect(validateAckEventIds(['evt_1', 'evt_2', 'evt_1', 'evt_3', 'evt_2'])).toEqual([
      'evt_1',
      'evt_2',
      'evt_3',
    ]);
  });

  test('summarizeAckedEvents returns ack count and ids', () => {
    const rows: AckUpdateRow[] = [{ id: 'evt_1' }, { id: 'evt_2' }];

    expect(summarizeAckedEvents(rows)).toEqual({
      acked: 2,
      eventIds: ['evt_1', 'evt_2'],
    });
  });
});
