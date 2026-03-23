import 'server-only';

import { count, eq } from 'drizzle-orm';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events } from '@/db/schema';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';

export const dynamic = 'force-dynamic';

type EventStatus = 'pending' | 'leased' | 'delivered' | 'failed' | 'expired';

export default async function DashboardPage() {
  const user = await requireAdminUser();

  const countsByStatus = await db
    .select({
      status: events.status,
      count: count(),
    })
    .from(events)
    .where(eq(events.userId, user.id))
    .groupBy(events.status);

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

  const statusCards: { label: string; value: number; status: EventStatus }[] = [
    { label: 'Pending', value: pending, status: 'pending' },
    { label: 'Leased', value: leased, status: 'leased' },
    { label: 'Delivered', value: delivered, status: 'delivered' },
    { label: 'Failed', value: failed, status: 'failed' },
    { label: 'Expired', value: expired, status: 'expired' },
  ];

  const statusColors: Record<EventStatus, string> = {
    pending: 'text-blue-400',
    leased: 'text-amber-400',
    delivered: 'text-emerald-400',
    failed: 'text-red-400',
    expired: 'text-zinc-400',
  };

  return (
    <section className="space-y-6">
      <DashboardPageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Use the dashboard navigation to manage nodes, routes, and events for your public ingress and private delivery pipeline."
      />

      <div>
        <p className="mb-3 text-sm font-medium">Event summary</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <article className="border-border/70 bg-background/40 rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="mt-1 text-2xl font-semibold">{total}</p>
          </article>
          <article className="border-border/70 bg-background/40 rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs">Success rate</p>
            <p className="mt-1 text-2xl font-semibold">{successRate}%</p>
          </article>
          {statusCards.map((card) => (
            <article key={card.status} className="border-border/70 bg-background/40 rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">{card.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${statusColors[card.status]}`}>
                {card.value}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Nodes',
            description: 'Register OpenClaw nodes and monitor their connection status.',
          },
          {
            title: 'Routes',
            description: 'Define public webhook endpoints and inspect ingress settings.',
          },
          {
            title: 'Events',
            description: 'Review queued events, delivery attempts, and failures.',
          },
        ].map((item) => (
          <article key={item.title} className="border-border/70 bg-background/40 rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
