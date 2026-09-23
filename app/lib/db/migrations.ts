import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type postgres from 'postgres';

type Sql = ReturnType<typeof postgres>;
type Transaction = {
  // postgres.js types narrow params aggressively; migration SQL is controlled repo input.
  unsafe: (statement: string, params?: never[]) => Promise<unknown>;
};

async function runStatement(tx: Transaction, statement: string) {
  await tx.unsafe(statement);
}

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function recordMigration(tx: Transaction, name: string, hash: string) {
  await tx.unsafe(
    `INSERT INTO "__clawproxy_migrations" ("name", "hash") VALUES (${sqlString(name)}, ${sqlString(hash)})`
  );
}

export function splitMigrationStatements(sql: string) {
  return sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function migrationHash(contents: string) {
  return createHash('sha256').update(contents).digest('hex');
}

export async function applyCommittedMigrations(sql: Sql, migrationsDir = join(process.cwd(), 'db/migrations')) {
  await sql`
    CREATE TABLE IF NOT EXISTS "__clawproxy_migrations" (
      "name" text PRIMARY KEY NOT NULL,
      "hash" text NOT NULL,
      "applied_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `;

  const names = (await readdir(migrationsDir))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b));

  for (const name of names) {
    const contents = await readFile(join(migrationsDir, name), 'utf8');
    const hash = migrationHash(contents);
    const existing = await sql<{ hash: string }[]>`
      SELECT hash FROM "__clawproxy_migrations" WHERE name = ${name} LIMIT 1
    `;

    if (existing[0]) {
      if (existing[0].hash !== hash) {
        throw new Error(`Migration ${name} was already applied with a different hash`);
      }
      continue;
    }

    const statements = splitMigrationStatements(contents);
    await sql.begin(async (tx) => {
      for (const statement of statements) {
        await runStatement(tx, statement);
      }
      await recordMigration(tx, name, hash);
    });
  }
}
