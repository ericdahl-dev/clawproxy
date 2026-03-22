import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

// Next.js loads .env* automatically; drizzle-kit does not — mirror that for CLI.
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true, quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Define it in .env.local (or .env), or export it before running drizzle-kit.'
  );
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
