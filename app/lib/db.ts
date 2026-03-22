import 'server-only';
import postgres from 'postgres';

/** Read at runtime — avoids Next bundling a build-time DATABASE_URL into Docker images. */
function databaseUrl(): string {
  const url = process.env['DATABASE_URL']?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

export const sql = postgres(databaseUrl(), { ssl: 'require' });
