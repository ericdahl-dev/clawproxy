import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

/**
 * Next only substitutes *literal* `process.env.NEXT_PUBLIC_*` references when
 * it builds the client bundle. Reading the same name dynamically — say
 * `env['NEXT_PUBLIC_SENTRY_DSN']` inside a helper — is left untouched, so the
 * value is `undefined` in the browser and Sentry disables itself without any
 * error. That shipped once already; these tests keep it from shipping again.
 */
describe('instrumentation-client.ts', () => {
  const source = readFileSync(
    path.resolve(__dirname, '../../instrumentation-client.ts'),
    'utf8',
  );

  test('references the public DSN literally so the bundler can inline it', () => {
    expect(source).toContain('process.env.NEXT_PUBLIC_SENTRY_DSN');
  });

  test('does not hand the raw process.env object to the options builder', () => {
    // buildSentryOptions('client') with no second argument falls back to
    // process.env, which is exactly the non-inlinable path.
    expect(source).not.toMatch(/buildSentryOptions\(\s*'client'\s*\)/);
  });
});
