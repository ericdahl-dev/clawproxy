export type ColumnInfo = {
  table: string;
  column: string;
  type: string;
  nullable: boolean;
  default: string | null;
};

export type IndexInfo = { table: string; name: string; definition: string };

export type SchemaSnapshot = {
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  /** Hashes recorded in drizzle.__drizzle_migrations. */
  migrations: string[];
};

function describeColumn(c: ColumnInfo): string {
  return `${c.type} ${c.nullable ? 'NULL' : 'NOT NULL'} default ${c.default ?? 'null'}`;
}

/** Differences between the schema the migrations produce and what production actually has. */
export function diffSchemas(expected: SchemaSnapshot, actual: SchemaSnapshot): string[] {
  const problems: string[] = [];

  const colKey = (c: ColumnInfo) => `${c.table}.${c.column}`;
  const expectedCols = new Map(expected.columns.map((c) => [colKey(c), c]));
  const actualCols = new Map(actual.columns.map((c) => [colKey(c), c]));
  for (const [key] of expectedCols) {
    if (!actualCols.has(key)) problems.push(`missing column ${key}`);
  }
  for (const [key] of actualCols) {
    if (!expectedCols.has(key)) problems.push(`unexpected column ${key}`);
  }
  for (const [key, exp] of expectedCols) {
    const act = actualCols.get(key);
    if (act && describeColumn(exp) !== describeColumn(act)) {
      problems.push(`changed column ${key}: expected ${describeColumn(exp)}, got ${describeColumn(act)}`);
    }
  }

  const idxKey = (i: IndexInfo) => `${i.table}.${i.name}`;
  const expectedIdx = new Map(expected.indexes.map((i) => [idxKey(i), i]));
  const actualIdx = new Map(actual.indexes.map((i) => [idxKey(i), i]));
  for (const [key, exp] of expectedIdx) {
    if (!actualIdx.has(key)) problems.push(`missing index ${key}: ${exp.definition}`);
  }
  for (const [key, act] of actualIdx) {
    if (!expectedIdx.has(key)) problems.push(`unexpected index ${key}: ${act.definition}`);
  }
  for (const [key, exp] of expectedIdx) {
    const act = actualIdx.get(key);
    if (act && act.definition !== exp.definition) {
      problems.push(`changed index ${key}: expected ${exp.definition}, got ${act.definition}`);
    }
  }

  const applied = new Set(actual.migrations);
  const known = new Set(expected.migrations);
  for (const hash of expected.migrations) {
    if (!applied.has(hash)) problems.push(`unapplied migration ${hash}`);
  }
  for (const hash of actual.migrations) {
    if (!known.has(hash)) problems.push(`unknown migration recorded in production ${hash}`);
  }

  return problems;
}
