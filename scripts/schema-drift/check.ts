/**
 * Compare production's schema with the schema the committed migrations produce.
 *
 * EXPECTED_DATABASE_URL: a throwaway database with every migration freshly applied (CI).
 * DRIFT_CHECK_DATABASE_URL: production, read-only role.
 * Exits 1 on any difference, including a migration that is committed but never applied.
 */
import { collectSnapshot } from './collect';
import { diffSchemas } from './diff';

async function main() {
  const expectedUrl = process.env.EXPECTED_DATABASE_URL;
  const actualUrl = process.env.DRIFT_CHECK_DATABASE_URL;
  if (!expectedUrl || !actualUrl) {
    console.error('EXPECTED_DATABASE_URL and DRIFT_CHECK_DATABASE_URL are required');
    process.exit(2);
  }

  const [expected, actual] = await Promise.all([collectSnapshot(expectedUrl), collectSnapshot(actualUrl)]);
  const problems = diffSchemas(expected, actual);

  if (problems.length === 0) {
    console.log(
      `✓ production matches the migrated schema (${expected.columns.length} columns, ` +
        `${expected.indexes.length} indexes, ${expected.migrations.length} migrations)`
    );
    return;
  }

  console.error(`✗ ${problems.length} difference(s) between production and the committed migrations:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nApply the pending migrations, or generate one that matches production.');
  process.exit(1);
}

main().catch((error) => {
  console.error('[schema-drift] check failed to run:', error);
  process.exit(2);
});
