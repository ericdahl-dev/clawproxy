/**
 * Create or reset a single admin user directly in Postgres, bypassing sign-up.
 * Useful for the very first login after switching to app-owned auth.
 *
 * Usage:
 *   DATABASE_URL=<coolify-url> yarn tsx scripts/seed-admin.ts you@example.com "Your Name"
 *
 * Prints a freshly generated password once. If the email already exists, updates its
 * password instead of creating a duplicate account.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import postgres from 'postgres';

import { hashPassword } from '../app/lib/auth/password';
import { postgresSslOption } from '../app/lib/db-config';

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: yarn tsx scripts/seed-admin.ts <email> [name]');
    process.exit(2);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(2);
  }

  const sql = postgres(databaseUrl, { ssl: postgresSslOption(databaseUrl) });
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || normalizedEmail;
  const password = randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(password);

  try {
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM auth_users WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (existing[0]) {
      await sql`
        UPDATE auth_users
        SET password_hash = ${passwordHash}, updated_at = now()
        WHERE id = ${existing[0].id}
      `;
      console.log(`Updated password for existing user ${normalizedEmail}.`);
    } else {
      await sql`
        INSERT INTO auth_users (id, email, name, password_hash)
        VALUES (${randomUUID()}, ${normalizedEmail}, ${displayName}, ${passwordHash})
      `;
      console.log(`Created user ${normalizedEmail}.`);
    }

    console.log(`\nEmail:    ${normalizedEmail}`);
    console.log(`Password: ${password}`);
    console.log('\nSave this now — it is not stored anywhere else. Sign in, then change your password.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error('[seed-admin] failed:', error);
  process.exit(1);
});
