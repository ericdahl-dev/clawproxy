import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes } from '@/db/schema';

import { NodesClient } from './nodes-client';

export const dynamic = 'force-dynamic';

export default async function DashboardNodesPage() {
  const user = await requireAdminUser();

  const nodeList = await db
    .select({
      id: nodes.id,
      name: nodes.name,
      slug: nodes.slug,
      status: nodes.status,
      lastSeenAt: nodes.lastSeenAt,
      createdAt: nodes.createdAt,
    })
    .from(nodes)
    .where(eq(nodes.userId, user.id))
    .orderBy(desc(nodes.createdAt));

  return (
    <section className="space-y-4">
      <div>
        <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
          Nodes
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Connected nodes</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          Register and monitor private OpenClaw nodes that pull events from the queue.
        </p>
      </div>

      <NodesClient initialNodes={nodeList} />
    </section>
  );
}
