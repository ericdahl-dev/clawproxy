import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes, routes } from '@/db/schema';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

import { RoutesClient } from './routes-client';

export const dynamic = 'force-dynamic';

export default async function DashboardRoutesPage() {
  const user = await requireAdminUser();

  const [routeList, nodeList] = await Promise.all([
    db
      .select({
        id: routes.id,
        nodeId: routes.nodeId,
        nodeName: nodes.name,
        slug: routes.slug,
        enabled: routes.enabled,
        createdAt: routes.createdAt,
      })
      .from(routes)
      .leftJoin(nodes, eq(routes.nodeId, nodes.id))
      .where(eq(routes.userId, user.id))
      .orderBy(desc(routes.createdAt)),
    db
      .select({ id: nodes.id, name: nodes.name })
      .from(nodes)
      .where(eq(nodes.userId, user.id))
      .orderBy(nodes.name),
  ]);

  return (
    <section className="space-y-4">
      <DashboardPageHeader
        eyebrow="Routes"
        title="Webhook routes"
        description="Define public ingress endpoints for providers that need to reach your private node."
      />

      <RoutesClient initialRoutes={routeList} availableNodes={nodeList} />
    </section>
  );
}
