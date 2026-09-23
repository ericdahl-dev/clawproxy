/**
 * Build the "expected" schema for drift comparison using the exact same migration
 * mechanism production uses (app/lib/db/migrations.ts -> public.__clawproxy_migrations),
 * rather than `drizzle-kit migrate` which tracks in a different table
 * (drizzle.__drizzle_migrations) that production never creates.
 */
import postgres from 'postgres';

import { applyCommittedMigrations } from '../../app/lib/db/migrations';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(2);
  }

  const sql = postgres(url, { max: 1 });
  try {
    await applyCommittedMigrations(sql);
    console.log('[schema-drift] applied committed migrations to the expected database');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('[schema-drift] failed to apply migrations:', error);
  process.exit(2);
});
