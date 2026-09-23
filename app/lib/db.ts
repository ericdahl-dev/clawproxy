import 'server-only';
import postgres from 'postgres';

import { postgresSslOption } from '@/app/lib/db-config';

/** Read at runtime — avoids Next bundling a build-time DATABASE_URL into Docker images. */
function databaseUrl(): string {
  const url = process.env['DATABASE_URL']?.trim();
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
}

const url = databaseUrl();
export const sql = postgres(url, { ssl: postgresSslOption(url) });
