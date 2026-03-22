import { count, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return NextResponse.json({
      ok: true,
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
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
