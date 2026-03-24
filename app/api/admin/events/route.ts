import { and, desc, eq, gte, inArray } from 'drizzle-orm';

import { decrypt } from '@/app/lib/crypto/encryption';
import { db } from '@/app/lib/db/client';
import { jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { events, nodes } from '@/db/schema';

const EVENT_STATUSES = ['pending', 'leased', 'delivered', 'failed', 'expired'] as const;
type EventStatus = (typeof EVENT_STATUSES)[number];

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function isEventStatus(s: string): s is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(s);
}

function parseDateRange(range: string | null): Date | null {
  if (!range) return null;
  const now = new Date();
  if (range === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (range === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export async function GET(request: Request) {
  return withAdminUser(async (user) => {
    const userId = user.id;

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const nodeIdParam = url.searchParams.get('nodeId');
    const dateRangeParam = url.searchParams.get('dateRange');
    const limitParam = url.searchParams.get('limit');
    const offsetParam = url.searchParams.get('offset');

    const statusFilter: EventStatus[] = statusParam
      ? statusParam.split(',').filter(isEventStatus)
      : [];

    const limitValue = Math.min(
      Math.max(1, parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const offsetValue = Math.max(0, parseInt(offsetParam ?? '0', 10) || 0);

    const dateFrom = parseDateRange(dateRangeParam);

    const conditions = [eq(events.userId, userId)];
    if (statusFilter.length > 0) {
      conditions.push(inArray(events.status, statusFilter));
    }
    if (nodeIdParam) {
      conditions.push(eq(events.nodeId, nodeIdParam));
    }
    if (dateFrom) {
      conditions.push(gte(events.receivedAt, dateFrom));
    }

    const result = await db
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
      .where(and(...conditions))
      .orderBy(desc(events.receivedAt))
      .limit(limitValue)
      .offset(offsetValue);

    return jsonOk({
      events: result.map((e) => ({ ...e, nodeName: e.nodeName ? decrypt(e.nodeName) : null })),
    });
  });
}
