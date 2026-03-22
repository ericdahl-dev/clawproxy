import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes, routes } from '@/db/schema';

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
      <div>
        <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
          Routes
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Webhook routes</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          Define public ingress endpoints for providers that need to reach your private node.
        </p>
      </div>

      <RoutesClient initialRoutes={routeList} availableNodes={nodeList} />
    </section>
  );
}
