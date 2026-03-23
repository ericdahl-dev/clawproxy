import { count, eq } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { events } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withAdminUser(async (user) => {
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
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return jsonOk({
      metrics: {
        total,
        byStatus: {
          pending: totals.pending ?? 0,
          leased: totals.leased ?? 0,
          delivered: totals.delivered ?? 0,
          failed: totals.failed ?? 0,
          expired: totals.expired ?? 0,
        },
        successRate,
      },
    });
  });
}
