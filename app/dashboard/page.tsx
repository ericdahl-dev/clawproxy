import 'server-only';

import { count, desc, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import {
  DAILY_EVENT_CHART_DAYS,
  getDailyEventCounts,
} from '@/app/lib/dashboard/event-daily-counts';
import { decrypt } from '@/app/lib/crypto/encryption';
import { db } from '@/app/lib/db/client';
import { events, nodes } from '@/db/schema';
import { DashboardEventsChart } from '@/components/app/dashboard-events-chart';
import { DashboardMetricCards } from '@/components/app/dashboard-metric-cards';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardRecentEvents } from '@/components/app/dashboard-recent-events';
import { DashboardRelaySummary } from '@/components/app/dashboard-relay-summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireAdminUser();

  const [countsByStatus, dailySeries, recentList] = await Promise.all([
    db
      .select({
        status: events.status,
        count: count(),
      })
      .from(events)
      .where(eq(events.userId, user.id))
      .groupBy(events.status),
    getDailyEventCounts(user.id),
    db
      .select({
        id: events.id,
        nodeName: nodes.name,
        status: events.status,
        contentType: events.contentType,
        receivedAt: events.receivedAt,
      })
      .from(events)
      .leftJoin(nodes, eq(events.nodeId, nodes.id))
      .where(eq(events.userId, user.id))
      .orderBy(desc(events.receivedAt))
      .limit(10),
  ]);

  const totals = countsByStatus.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});

  const total = Object.values(totals).reduce((a, b) => a + b, 0);
  const delivered = totals.delivered ?? 0;
  const failed = totals.failed ?? 0;
  const expired = totals.expired ?? 0;
  const pending = totals.pending ?? 0;
  const leased = totals.leased ?? 0;
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const recentRows = recentList.map((e) => ({
    id: e.id,
    status: e.status,
    nodeName: e.nodeName ? decrypt(e.nodeName) : null,
    contentType: e.contentType,
    receivedAt: e.receivedAt,
  }));

  return (
    <section className="space-y-8">
      <DashboardPageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Use the dashboard navigation to manage nodes, routes, and events for your public ingress and Hermes Agent / OpenClaw delivery pipeline."
      />

      <DashboardRelaySummary />

      <DashboardMetricCards
        total={total}
        successRate={successRate}
        delivered={delivered}
        failed={failed}
        pending={pending}
        leased={leased}
        expired={expired}
      />

      <div className="flex min-w-0 flex-col gap-6">
        <Card size="sm" className="min-w-0">
          <CardHeader>
            <CardTitle>Events over time</CardTitle>
            <CardDescription>
              Received webhooks per day (UTC), last {DAILY_EVENT_CHART_DAYS} days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardEventsChart data={dailySeries} />
          </CardContent>
        </Card>
        <div className="min-w-0">
          <DashboardRecentEvents events={recentRows} />
        </div>
      </div>
    </section>
  );
}
