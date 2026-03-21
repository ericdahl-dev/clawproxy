import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events } from '@/db/schema';

export async function GET() {
  try {
    const user = await requireAdminUser();
    const userId = user.id;

    const result = await db
      .select({
        id: events.id,
        nodeId: events.nodeId,
        routeId: events.routeId,
        status: events.status,
        contentType: events.contentType,
        receivedAt: events.receivedAt,
        leaseExpiresAt: events.leaseExpiresAt,
        ackedAt: events.ackedAt,
        expiresAt: events.expiresAt,
        createdAt: events.createdAt,
      })
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(desc(events.receivedAt));

    return NextResponse.json({ ok: true, events: result });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
