import { describe, expect, test } from 'vitest';

import { splitMigrationStatements } from '@/app/lib/db/migrations';

describe('splitMigrationStatements', () => {
  test('splits drizzle statement breakpoints and drops whitespace-only chunks', () => {
    expect(
      splitMigrationStatements(`
        CREATE TABLE example (id text);--> statement-breakpoint

        CREATE INDEX example_id_idx ON example (id);
        --> statement-breakpoint
      `)
    ).toEqual([
      'CREATE TABLE example (id text);',
      'CREATE INDEX example_id_idx ON example (id);',
    ]);
  });
});
