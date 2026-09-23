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

/**
 * SSL mode is configurable via DATABASE_SSL because internal/private Postgres
 * instances (e.g. Coolify's docker-network Postgres) often don't terminate TLS,
 * which causes ECONNRESET on connect if ssl is forced to 'require'.
 * Defaults to 'require' to preserve prior behavior for externally-hosted DBs.
 */
function sslMode(): 'require' | false {
  const mode = process.env['DATABASE_SSL']?.trim().toLowerCase();
  if (mode === 'disable' || mode === 'false') return false;
  return 'require';
}

export const sql = postgres(databaseUrl(), { ssl: sslMode() });
