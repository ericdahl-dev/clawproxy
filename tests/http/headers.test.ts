import { describe, expect, test } from 'vitest';

import { headersToObject } from '@/app/lib/http/headers';

describe('headersToObject', () => {
  test('converts an empty Headers object to an empty record', () => {
    const result = headersToObject(new Headers());

    expect(result).toEqual({});
  });

  test('converts headers to a plain key-value record', () => {
    const headers = new Headers({
      'content-type': 'application/json',
      'x-custom-header': 'value',
    });
    const result = headersToObject(headers);

    expect(result['content-type']).toBe('application/json');
    expect(result['x-custom-header']).toBe('value');
  });

  test('normalises header names to lowercase', () => {
    const headers = new Headers();
    headers.append('X-Request-ID', 'abc-123');

    const result = headersToObject(headers);

    expect(result['x-request-id']).toBe('abc-123');
  });
});
