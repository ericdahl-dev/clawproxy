import { describe, expect, test } from 'vitest';

import { buildSentryOptions } from '@/app/lib/observability/sentry-options';

describe('buildSentryOptions', () => {
  test('is disabled when no DSN is configured', () => {
    const options = buildSentryOptions('server', { NODE_ENV: 'production' });

    expect(options.enabled).toBe(false);
    expect(options.dsn).toBeUndefined();
  });

  test('stays disabled during tests even when a DSN is present', () => {
    const options = buildSentryOptions('server', {
      NODE_ENV: 'test',
      SENTRY_DSN: 'https://key@errors.example.dev/1',
    });

    expect(options.enabled).toBe(false);
  });

  test('client only reads the public DSN', () => {
    const options = buildSentryOptions('client', {
      NODE_ENV: 'production',
      SENTRY_DSN: 'https://server-only@errors.example.dev/1',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@errors.example.dev/1',
    });

    expect(options.dsn).toBe('https://public@errors.example.dev/1');
  });

  test('client ignores a server-only DSN so it never reaches the bundle', () => {
    const options = buildSentryOptions('client', {
      NODE_ENV: 'production',
      SENTRY_DSN: 'https://server-only@errors.example.dev/1',
    });

    expect(options.dsn).toBeUndefined();
    expect(options.enabled).toBe(false);
  });

  test('server falls back to the public DSN when no private one is set', () => {
    const options = buildSentryOptions('server', {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@errors.example.dev/1',
    });

    expect(options.dsn).toBe('https://public@errors.example.dev/1');
    expect(options.enabled).toBe(true);
  });

  test('server prefers the private DSN over the public one', () => {
    const options = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SENTRY_DSN: 'https://private@errors.example.dev/1',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@errors.example.dev/1',
    });

    expect(options.dsn).toBe('https://private@errors.example.dev/1');
  });

  test('treats a blank DSN as absent', () => {
    const options = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SENTRY_DSN: '   ',
    });

    expect(options.dsn).toBeUndefined();
    expect(options.enabled).toBe(false);
  });

  test('environment defaults to NODE_ENV and can be overridden', () => {
    const fromNodeEnv = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SENTRY_DSN: 'https://key@errors.example.dev/1',
    });
    expect(fromNodeEnv.environment).toBe('production');

    const overridden = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SENTRY_ENVIRONMENT: 'preview',
      SENTRY_DSN: 'https://key@errors.example.dev/1',
    });
    expect(overridden.environment).toBe('preview');
  });

  test('release comes from SOURCE_COMMIT, or SENTRY_RELEASE when set', () => {
    const fromCommit = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SOURCE_COMMIT: 'abc1234',
    });
    expect(fromCommit.release).toBe('abc1234');

    const explicit = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SOURCE_COMMIT: 'abc1234',
      SENTRY_RELEASE: 'clawproxy@1.2.3',
    });
    expect(explicit.release).toBe('clawproxy@1.2.3');

    const blank = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SOURCE_COMMIT: '',
    });
    expect(blank.release).toBeUndefined();
  });

  test('uses GlitchTip-safe defaults', () => {
    const options = buildSentryOptions('client', {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@errors.example.dev/1',
    });

    // GlitchTip has no session replay and only partial performance support.
    expect(options.tracesSampleRate).toBe(0);
    expect(options.replaysSessionSampleRate).toBe(0);
    expect(options.replaysOnErrorSampleRate).toBe(0);
  });

  test('opts out of every data category the SDK collects by default', () => {
    // SDK v11 collects cookies, headers and query params unless told otherwise.
    // This app carries Neon Auth session cookies and node auth tokens, so all
    // of it must stay out of error reports.
    const options = buildSentryOptions('server', {
      NODE_ENV: 'production',
      SENTRY_DSN: 'https://key@errors.example.dev/1',
    });

    expect(options.dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    });
  });
});
