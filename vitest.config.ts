import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/support/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    env: {
      ENCRYPTION_KEY: 'a'.repeat(64),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['app/**/*.{ts,tsx}', 'db/**/*.ts', 'proxy.ts'],
      exclude: [
        '**/*.d.ts',
        'app/**/layout.tsx',
        '**/types/**',
        'tests/**',
        'node_modules/**',
      ],
      thresholds: {
        statements: 70,
        branches: 58,
        functions: 58,
        lines: 70,
      },
    },
  },
});
