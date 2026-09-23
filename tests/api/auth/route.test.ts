import { beforeEach, describe, expect, test, vi } from 'vitest';

const service = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  signOutSession: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

vi.mock('@/app/lib/auth/server', () => service);

import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route';
import { POST as signIn } from '@/app/api/auth/sign-in/route';
import { POST as signOut } from '@/app/api/auth/sign-out/route';
import { POST as signUp } from '@/app/api/auth/sign-up/route';

function jsonRequest(
  path: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
}

describe('first-party auth API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('sign-in creates an httpOnly session cookie on success', async () => {
    service.signInWithPassword.mockResolvedValue({
      ok: true,
      token: 'session-token',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      user: { id: 'user-1', email: 'user@example.com', name: 'User' },
    });

    const response = await signIn(jsonRequest('/api/auth/sign-in', {
      email: 'USER@example.com',
      password: 'secret123',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, data: { user: { id: 'user-1' } } });
    expect(service.signInWithPassword).toHaveBeenCalledWith('USER@example.com', 'secret123');
    expect(response.headers.get('set-cookie')).toContain('clawproxy_session=session-token');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });

  test('sign-in returns 401 for bad credentials', async () => {
    service.signInWithPassword.mockResolvedValue({ ok: false, error: 'Invalid email or password' });

    const response = await signIn(jsonRequest('/api/auth/sign-in', {
      email: 'user@example.com',
      password: 'wrong',
    }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Invalid email or password' });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  test('rate limits repeated failed sign-in attempts by IP and email', async () => {
    service.signInWithPassword.mockResolvedValue({ ok: false, error: 'Invalid email or password' });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await signIn(jsonRequest('/api/auth/sign-in', {
        email: 'rate-limit@example.com',
        password: 'wrong',
      }, { 'x-forwarded-for': '203.0.113.10' }));
      expect(response.status).toBe(401);
    }

    const response = await signIn(jsonRequest('/api/auth/sign-in', {
      email: 'rate-limit@example.com',
      password: 'wrong',
    }, { 'x-forwarded-for': '203.0.113.10' }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
    expect(body).toEqual({ ok: false, error: 'Too many sign-in attempts' });
    expect(service.signInWithPassword).toHaveBeenCalledTimes(5);
  });

  test('sign-up creates the user and signs them in', async () => {
    service.signUpWithPassword.mockResolvedValue({
      ok: true,
      token: 'new-session',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      user: { id: 'user-2', email: 'new@example.com', name: 'New User' },
    });

    const response = await signUp(jsonRequest('/api/auth/sign-up', {
      email: 'new@example.com',
      password: 'long-enough',
      name: 'New User',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user.email).toBe('new@example.com');
    expect(service.signUpWithPassword).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'long-enough',
      name: 'New User',
    });
    expect(response.headers.get('set-cookie')).toContain('clawproxy_session=new-session');
  });

  test('sign-up returns 409 when the email already exists', async () => {
    service.signUpWithPassword.mockResolvedValue({ ok: false, error: 'Email already exists', status: 409 });

    const response = await signUp(jsonRequest('/api/auth/sign-up', {
      email: 'taken@example.com',
      password: 'long-enough',
    }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Email already exists');
  });

  test('rate limits repeated sign-up attempts by IP', async () => {
    service.signUpWithPassword.mockResolvedValue({ ok: false, error: 'Email already exists', status: 409 });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await signUp(jsonRequest('/api/auth/sign-up', {
        email: `attempt-${attempt}@example.com`,
        password: 'long-enough',
      }, { 'x-forwarded-for': '203.0.113.20' }));
      expect(response.status).toBe(409);
    }

    const response = await signUp(jsonRequest('/api/auth/sign-up', {
      email: 'blocked@example.com',
      password: 'long-enough',
    }, { 'x-forwarded-for': '203.0.113.20' }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('900');
    expect(body).toEqual({ ok: false, error: 'Too many sign-up attempts' });
    expect(service.signUpWithPassword).toHaveBeenCalledTimes(5);
  });

  test('forgot-password returns a neutral success response', async () => {
    service.requestPasswordReset.mockResolvedValue({ ok: true });

    const response = await forgotPassword(jsonRequest('/api/auth/forgot-password', {
      email: 'maybe@example.com',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(service.requestPasswordReset).toHaveBeenCalledWith('maybe@example.com');
  });

  test('sign-out clears the session cookie', async () => {
    service.signOutSession.mockResolvedValue({ ok: true });

    const response = await signOut(new Request('http://localhost/api/auth/sign-out', {
      method: 'POST',
      headers: { cookie: 'clawproxy_session=old-token' },
    }));

    expect(response.status).toBe(200);
    expect(service.signOutSession).toHaveBeenCalledWith('old-token');
    expect(response.headers.get('set-cookie')).toContain('clawproxy_session=;');
  });
});
