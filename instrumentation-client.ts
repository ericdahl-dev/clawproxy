import * as Sentry from '@sentry/nextjs';
import posthog from 'posthog-js';

import { buildSentryOptions } from '@/app/lib/observability/sentry-options';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
});

// These must be written as literal `process.env.X` expressions: that is the
// only form Next substitutes when building the client bundle. Reading them
// dynamically leaves `undefined` in the browser and silently disables Sentry.
const sentryOptions = buildSentryOptions('client', {
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NODE_ENV: process.env.NODE_ENV,
  SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});

Sentry.init({
  enabled: sentryOptions.enabled,
  dsn: sentryOptions.dsn,
  environment: sentryOptions.environment,
  release: sentryOptions.release,
  tracesSampleRate: sentryOptions.tracesSampleRate,
  // GlitchTip has no replay ingest, so never record or send one.
  replaysSessionSampleRate: sentryOptions.replaysSessionSampleRate,
  replaysOnErrorSampleRate: sentryOptions.replaysOnErrorSampleRate,
  dataCollection: sentryOptions.dataCollection,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
