import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

// Next.js loads .env* automatically; drizzle-kit does not — mirror that for CLI.
// An explicit DATABASE_URL in the environment wins over .env.local: `DATABASE_URL=... yarn
// db:migrate` used to be silently redirected to whatever .env.local pointed at (a dev branch),
// so a migration you believed you had applied never reached the database you named.
const explicitDatabaseUrl = process.env.DATABASE_URL;
loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true, quiet: true });

const databaseUrl = explicitDatabaseUrl ?? process.env.DATABASE_URL;
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
