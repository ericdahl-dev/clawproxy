import { NextRequest } from 'next/server';
import { describe, expect, test } from 'vitest';

import proxy, { config } from '../proxy';

describe('proxy dashboard guard', () => {
  test('redirects dashboard requests without a session cookie', () => {
    const request = new NextRequest('http://localhost/dashboard/nodes?tab=active');

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/auth/sign-in?next=%2Fdashboard%2Fnodes%3Ftab%3Dactive'
    );
    expect(config.matcher).toEqual(['/dashboard/:path*']);
  });

  test('allows dashboard requests with a session cookie', () => {
    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: 'clawproxy_session=token' },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
