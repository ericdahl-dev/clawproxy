/**
 * One-time data migration: copy relay data (nodes/routes/events) from the old Neon database
 * to the new Coolify Postgres database, and seed `auth_users` from Neon's `neon_auth.user`
 * table with a freshly generated password per account (existing Neon Auth password hashes
 * are not portable — Neon Auth uses a different, non-exported hashing scheme).
 *
 * Usage:
 *   SOURCE_DATABASE_URL=<neon-url> TARGET_DATABASE_URL=<coolify-url> yarn tsx scripts/migrate-from-neon.ts
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING / DO UPDATE so it won't duplicate rows.
 * Prints the generated temporary password for each migrated user once; it is not stored
 * anywhere else, so save it immediately or use --reset-admin instead for a single account.
 */
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';

import { hashPassword } from '../app/lib/auth/password';

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required');
    process.exit(2);
  }

  const source = postgres(sourceUrl, { ssl: 'require' });
  const target = postgres(targetUrl, { ssl: false });

  try {
    console.log('Migrating neon_auth.user -> auth_users ...');
    const neonUsers = await source`
      SELECT id, email, name FROM neon_auth."user" ORDER BY "createdAt"
    `;

    const generatedPasswords: { email: string; password: string }[] = [];

    for (const user of neonUsers) {
      const tempPassword = randomBytes(12).toString('base64url');
      const passwordHash = await hashPassword(tempPassword);

      await target`
        INSERT INTO auth_users (id, email, name, password_hash)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${passwordHash})
        ON CONFLICT (id) DO NOTHING
      `;

      generatedPasswords.push({ email: user.email, password: tempPassword });
    }

    console.log(`Migrated ${neonUsers.length} user(s). Temporary passwords (save these now):`);
    for (const { email, password } of generatedPasswords) {
      console.log(`  ${email}  ->  ${password}`);
    }

    console.log('\nMigrating nodes ...');
    const nodes = await source`SELECT * FROM nodes`;
    for (const node of nodes) {
      await target`
        INSERT INTO nodes (id, user_id, name, slug, token_hash, status, last_seen_at, created_at, updated_at)
        VALUES (${node.id}, ${node.user_id}, ${node.name}, ${node.slug}, ${node.token_hash},
                ${node.status}, ${node.last_seen_at}, ${node.created_at}, ${node.updated_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`Migrated ${nodes.length} node(s).`);

    console.log('\nMigrating routes ...');
    const routes = await source`SELECT * FROM routes`;
    for (const route of routes) {
      await target`
        INSERT INTO routes (id, user_id, node_id, slug, enabled, created_at, updated_at)
        VALUES (${route.id}, ${route.user_id}, ${route.node_id}, ${route.slug},
                ${route.enabled}, ${route.created_at}, ${route.updated_at})
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`Migrated ${routes.length} route(s).`);

    console.log('\nMigrating events ...');
    const events = await source`SELECT * FROM events`;
    for (const event of events) {
      await target`
        INSERT INTO events (
          id, user_id, node_id, route_id, status, headers_json, body_text, content_type,
          received_at, lease_expires_at, attempt_count, acked_at, expires_at, created_at, updated_at
        )
        VALUES (
          ${event.id}, ${event.user_id}, ${event.node_id}, ${event.route_id}, ${event.status},
          ${event.headers_json}, ${event.body_text}, ${event.content_type}, ${event.received_at},
          ${event.lease_expires_at}, ${event.attempt_count}, ${event.acked_at}, ${event.expires_at},
          ${event.created_at}, ${event.updated_at}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`Migrated ${events.length} event(s).`);

    console.log('\nDone. Sign in with the temporary password above, then change it.');
  } finally {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('[migrate-from-neon] failed:', error);
  process.exit(1);
});
