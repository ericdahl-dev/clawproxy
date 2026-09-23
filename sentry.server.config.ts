import * as Sentry from '@sentry/nextjs';

import { buildSentryOptions } from '@/app/lib/observability/sentry-options';

const options = buildSentryOptions('server');

Sentry.init({
  enabled: options.enabled,
  dsn: options.dsn,
  environment: options.environment,
  release: options.release,
  tracesSampleRate: options.tracesSampleRate,
  dataCollection: options.dataCollection,
});
