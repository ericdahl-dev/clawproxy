import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events, nodes } from '@/db/schema';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

import { EventsClient } from './events-client';

export const dynamic = 'force-dynamic';

export default async function DashboardEventsPage() {
  const user = await requireAdminUser();

  const [eventList, nodeList] = await Promise.all([
    db
      .select({
        id: events.id,
        nodeId: events.nodeId,
        nodeName: nodes.name,
        routeId: events.routeId,
        status: events.status,
        contentType: events.contentType,
        receivedAt: events.receivedAt,
        leaseExpiresAt: events.leaseExpiresAt,
        attemptCount: events.attemptCount,
        ackedAt: events.ackedAt,
        expiresAt: events.expiresAt,
        createdAt: events.createdAt,
      })
      .from(events)
      .leftJoin(nodes, eq(events.nodeId, nodes.id))
      .where(eq(events.userId, user.id))
      .orderBy(desc(events.receivedAt))
      .limit(50),
    db
      .select({ id: nodes.id, name: nodes.name })
      .from(nodes)
      .where(eq(nodes.userId, user.id))
      .orderBy(nodes.name),
  ]);

  return (
    <section className="space-y-4">
      <DashboardPageHeader
        eyebrow="Events"
        title="Delivery events"
        description="Inspect queued webhook deliveries, acknowledgements, and failures."
      />

      <EventsClient initialEvents={eventList} availableNodes={nodeList} />
    </section>
  );
}
