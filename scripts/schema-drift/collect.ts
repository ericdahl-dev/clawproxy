import postgres from 'postgres';

import type { ColumnInfo, IndexInfo, SchemaSnapshot } from './diff';

/**
 * Read the shape of a database from pg_catalog.
 *
 * pg_catalog rather than information_schema: information_schema filters rows to objects the
 * current role has privileges on, so the least-privilege CI role would see an empty schema and
 * every table would look like drift.
 */
export async function collectSnapshot(databaseUrl: string): Promise<SchemaSnapshot> {
  const sql = postgres(databaseUrl, {
    max: 1,
    // Best-effort only: Neon's pooler drops this startup parameter, so it is not a guarantee.
    // The real control is the `drift_ro` role, which has no privileges on application tables.
    connection: { default_transaction_read_only: true },
  });
  try {
    const columns = (await sql<ColumnInfo[]>`
      SELECT c.relname AS table,
             a.attname AS column,
             format_type(a.atttypid, a.atttypmod) AS type,
             NOT a.attnotnull AS nullable,
             pg_get_expr(d.adbin, d.adrelid) AS default
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.relname, a.attname
    `) as unknown as ColumnInfo[];

    const indexes = (await sql<IndexInfo[]>`
      SELECT tablename AS table, indexname AS name, indexdef AS definition
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `) as unknown as IndexInfo[];

    const migrationRows = await sql<{ hash: string }[]>`
      SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at, id
    `;

    return {
      columns: columns.map((c) => ({ ...c, default: c.default ?? null })),
      indexes,
      migrations: migrationRows.map((row) => row.hash),
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
