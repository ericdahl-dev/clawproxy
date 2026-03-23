import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes } from '@/db/schema';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

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
      <DashboardPageHeader
        eyebrow="Nodes"
        title="Connected nodes"
        description="Register and monitor private OpenClaw nodes that pull events from the queue."
      />

      <NodesClient initialNodes={nodeList} />
    </section>
  );
}
