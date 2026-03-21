import { sql } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

async function getDbVersion() {
  const result = await sql`SELECT version()`;
  return result[0].version as string;
}

export default async function Home() {
  const version = await getDbVersion();

  return (
    <main className="min-h-screen p-10 font-sans">
      <h1 className="text-3xl font-semibold">Next.js + Neon</h1>
      <p className="mt-4">PostgreSQL Version: {version}</p>
    </main>
  );
}
