import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';

import { nodes, routes } from '@/db/schema';

function uniqueIndexColumns(table: Parameters<typeof getTableConfig>[0]) {
  return getTableConfig(table)
    .indexes.filter((idx) => idx.config.unique)
    .map((idx) => ({
      name: idx.config.name,
      columns: idx.config.columns.map((col) => ('name' in col ? col.name : String(col))),
    }));
}

describe('slug uniqueness is scoped per user', () => {
  it('routes: slug is unique per user, not globally', () => {
    expect(uniqueIndexColumns(routes)).toEqual([
      { name: 'routes_user_id_slug_key', columns: ['user_id', 'slug'] },
    ]);
  });

  it('nodes: slug is unique per user, not globally', () => {
    expect(uniqueIndexColumns(nodes)).toEqual([
      { name: 'nodes_user_id_slug_key', columns: ['user_id', 'slug'] },
    ]);
  });
});
