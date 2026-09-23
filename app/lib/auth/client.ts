'use client';

type AuthResult<T = unknown> =
  | { data: T; error?: never }
  | { data?: never; error: { message: string } };

async function postJson<T>(path: string, body: Record<string, unknown> = {}): Promise<AuthResult<T>> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    data?: T;
    error?: string;
  };

  if (!response.ok || payload.ok === false) {
    return { error: { message: payload.error || 'Request failed' } };
  }

  return { data: payload.data as T };
}

export async function createClientAuth() {
  return {
    signIn: {
      email(input: { email: string; password: string }) {
        return postJson('/api/auth/sign-in', input);
      },
    },
    signUp: {
      email(input: { email: string; password: string; name?: string }) {
        return postJson('/api/auth/sign-up', input);
      },
    },
    requestPasswordReset(input: { email: string; redirectTo?: string }) {
      return postJson('/api/auth/forgot-password', input);
    },
    signOut() {
      return postJson('/api/auth/sign-out');
    },
  };
}
