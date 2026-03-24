import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Drizzle migration journal', () => {
  it('keeps "when" monotonic in journal order (required by drizzle-kit migrate)', () => {
    const raw = readFileSync(resolve(process.cwd(), 'db/migrations/meta/_journal.json'), 'utf8');
    const journal = JSON.parse(raw) as { entries: { when: number }[] };
    let prev = 0;
    for (const e of journal.entries) {
      expect(e.when, 'each entry.when must be > previous (PgDialect.migrate uses max(created_at))').toBeGreaterThan(
        prev
      );
      prev = e.when;
    }
  });
});
