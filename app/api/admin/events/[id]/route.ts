import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events, nodes } from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminUser();
    const { id } = await params;

    const result = await db
      .select({
        id: events.id,
        nodeId: events.nodeId,
        nodeName: nodes.name,
        routeId: events.routeId,
        status: events.status,
        headersJson: events.headersJson,
        bodyText: events.bodyText,
        contentType: events.contentType,
        receivedAt: events.receivedAt,
        leaseExpiresAt: events.leaseExpiresAt,
        attemptCount: events.attemptCount,
        ackedAt: events.ackedAt,
        expiresAt: events.expiresAt,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .leftJoin(nodes, eq(events.nodeId, nodes.id))
      .where(and(eq(events.id, id), eq(events.userId, user.id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, event: result[0] });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
