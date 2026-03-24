import 'server-only';

import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import type { DailyEventPoint } from '@/app/lib/dashboard/types';
import { events } from '@/db/schema';

export const DAILY_EVENT_CHART_DAYS = 30;

/**
 * Event counts per calendar day (UTC) for the last {@link DAILY_EVENT_CHART_DAYS} days,
 * including days with zero events.
 */
export async function getDailyEventCounts(userId: string): Promise<DailyEventPoint[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAILY_EVENT_CHART_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const dayBucket = sql`(${events.receivedAt})::date`;

  const rows = await db
    .select({
      day: sql<string>`to_char(${dayBucket}, 'YYYY-MM-DD')`.as('day'),
      count: sql<number>`count(*)::int`.as('count'),
    })
    .from(events)
    .where(and(eq(events.userId, userId), gte(events.receivedAt, since)))
    .groupBy(dayBucket)
    .orderBy(dayBucket);

  const byDay = new Map(rows.map((r) => [r.day, r.count]));

  const series: DailyEventPoint[] = [];
  for (let i = 0; i < DAILY_EVENT_CHART_DAYS; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, events: byDay.get(key) ?? 0 });
  }

  return series;
}
