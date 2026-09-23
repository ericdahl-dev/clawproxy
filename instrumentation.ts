import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Reports errors thrown inside route handlers, server components, and
// middleware. The WebSocket server in server.ts sits outside Next's request
// lifecycle, so errors there are only caught by the SDK's global handlers.
export const onRequestError = Sentry.captureRequestError;
