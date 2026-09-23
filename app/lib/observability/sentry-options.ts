/**
 * Shared Sentry SDK options for the self-hosted GlitchTip instance.
 *
 * GlitchTip speaks the Sentry protocol but does not implement session replay
 * and only partially implements performance tracing, so those are pinned off
 * here rather than left to SDK defaults.
 */

export type SentryRuntime = 'client' | 'server' | 'edge';

/**
 * Every category below defaults to `true` in the SDK. This app carries Neon
 * Auth session cookies and node auth tokens, so each one is turned off
 * explicitly rather than trusted to a default.
 */
export interface SentryDataCollection {
  userInfo: false;
  cookies: false;
  httpHeaders: false;
  httpBodies: [];
  urlQueryParams: false;
}

export interface SentryOptions {
  enabled: boolean;
  dsn: string | undefined;
  environment: string;
  release: string | undefined;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  dataCollection: SentryDataCollection;
}

type Env = Record<string, string | undefined>;

function readValue(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readDsn(runtime: SentryRuntime, env: Env): string | undefined {
  // The client bundle must only ever see the public DSN; reading SENTRY_DSN
  // here would inline a server-only value into JavaScript we ship to browsers.
  if (runtime === 'client') return readValue(env, 'NEXT_PUBLIC_SENTRY_DSN');
  return readValue(env, 'SENTRY_DSN') ?? readValue(env, 'NEXT_PUBLIC_SENTRY_DSN');
}

export function buildSentryOptions(
  runtime: SentryRuntime,
  env: Env = process.env as Env,
): SentryOptions {
  const dsn = readDsn(runtime, env);
  const nodeEnv = readValue(env, 'NODE_ENV') ?? 'development';

  return {
    // Without a DSN there is nowhere to send events, and the test suite must
    // never reach the network even if one happens to be exported.
    enabled: Boolean(dsn) && nodeEnv !== 'test',
    dsn,
    environment: readValue(env, 'SENTRY_ENVIRONMENT') ?? nodeEnv,
    // Coolify exposes the deployed commit as SOURCE_COMMIT.
    release: readValue(env, 'SENTRY_RELEASE') ?? readValue(env, 'SOURCE_COMMIT'),
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  };
}
