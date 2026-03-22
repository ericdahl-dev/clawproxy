import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import nextConfig from '@/next.config';

const repoRoot = path.resolve(__dirname, '../..');

function readRepoFile(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('deployment configuration', () => {
  test('uses Next standalone output for production deployments', () => {
    expect(nextConfig.output).toBe('standalone');
  });

  test('defines a standalone build script for deployment platforms', () => {
    const packageJson = JSON.parse(readRepoFile('package.json')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['build:standalone']).toContain('next build');
  });

  test('includes a production Dockerfile that runs the standalone server', () => {
    const dockerfile = readRepoFile('Dockerfile');

    expect(dockerfile).toContain('npm run build:standalone');
    expect(dockerfile).toContain('COPY --from=builder /app/.next/standalone ./');
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  test('includes a Nixpacks config that builds and starts the standalone server', () => {
    const nixpacks = readRepoFile('nixpacks.toml');

    expect(nixpacks).toContain('npm run build:standalone');
    expect(nixpacks).toContain('node .next/standalone/server.js');
  });

  test('documents deployment environment variables and startup commands in the README', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain('DATABASE_URL');
    expect(readme).toContain('NEON_AUTH_BASE_URL');
    expect(readme).toContain('NEON_AUTH_COOKIE_SECRET');
    expect(readme).toContain('NEXT_PUBLIC_NEON_AUTH_BASE_URL');
    expect(readme).toContain('npm run build:standalone');
    expect(readme).toContain('node .next/standalone/server.js');
    expect(readme).toContain('docker build -t clawproxy .');
  });
});
