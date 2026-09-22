import { describe, expect, it } from 'vitest';

import { diffSchemas, type SchemaSnapshot } from '@/scripts/schema-drift/diff';

const base: SchemaSnapshot = {
  columns: [
    { table: 'routes', column: 'slug', type: 'text', nullable: false, default: null },
    { table: 'routes', column: 'user_id', type: 'text', nullable: false, default: null },
  ],
  indexes: [
    { table: 'routes', name: 'routes_user_id_slug_key', definition: 'CREATE UNIQUE INDEX routes_user_id_slug_key ON public.routes USING btree (user_id, slug)' },
  ],
  migrations: ['hash-0000', 'hash-0001'],
};

describe('diffSchemas', () => {
  it('reports nothing when production matches the migrated schema', () => {
    expect(diffSchemas(base, structuredClone(base))).toEqual([]);
  });

  it('reports an index that production is missing', () => {
    const prod = { ...structuredClone(base), indexes: [] };
    expect(diffSchemas(base, prod)).toEqual([
      'missing index routes.routes_user_id_slug_key: CREATE UNIQUE INDEX routes_user_id_slug_key ON public.routes USING btree (user_id, slug)',
    ]);
  });

  it('reports an index that exists only in production', () => {
    const prod = structuredClone(base);
    prod.indexes.push({ table: 'routes', name: 'routes_slug_key', definition: 'CREATE UNIQUE INDEX routes_slug_key ON public.routes USING btree (slug)' });
    expect(diffSchemas(base, prod)).toEqual([
      'unexpected index routes.routes_slug_key: CREATE UNIQUE INDEX routes_slug_key ON public.routes USING btree (slug)',
    ]);
  });

  it('reports an index whose definition differs', () => {
    const prod = structuredClone(base);
    prod.indexes[0].definition = 'CREATE UNIQUE INDEX routes_user_id_slug_key ON public.routes USING btree (slug)';
    expect(diffSchemas(base, prod)).toHaveLength(1);
    expect(diffSchemas(base, prod)[0]).toMatch(/^changed index routes\.routes_user_id_slug_key/);
  });

  it('reports missing, unexpected, and changed columns', () => {
    const prod = structuredClone(base);
    prod.columns = [
      { table: 'routes', column: 'slug', type: 'varchar', nullable: false, default: null },
      { table: 'routes', column: 'extra', type: 'text', nullable: true, default: null },
    ];
    expect(diffSchemas(base, prod)).toEqual([
      'missing column routes.user_id',
      'unexpected column routes.extra',
      'changed column routes.slug: expected text NOT NULL default null, got varchar NOT NULL default null',
    ]);
  });

  it('reports migrations in the repo that production has not applied', () => {
    const prod = { ...structuredClone(base), migrations: ['hash-0000'] };
    expect(diffSchemas(base, prod)).toEqual(['unapplied migration hash-0001']);
  });

  it('reports migrations production recorded that are not in the repo', () => {
    const prod = { ...structuredClone(base), migrations: ['hash-0000', 'hash-0001', 'hash-9999'] };
    expect(diffSchemas(base, prod)).toEqual(['unknown migration recorded in production hash-9999']);
  });
});
