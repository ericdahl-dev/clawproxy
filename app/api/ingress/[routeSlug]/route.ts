import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/app/lib/db/client';
import { decrypt, encrypt } from '@/app/lib/crypto/encryption';
import { getDefaultEventExpiryDate } from '@/app/lib/events/expires-at';
import { headersToObject } from '@/app/lib/http/headers';
import { isConnected, pushEventToNode } from '@/app/lib/ws/connection-manager';
import { events, routes } from '@/db/schema';

const LEASE_DURATION_MS = 60_000;

export async function POST(
  request: Request,
  context: { params: Promise<{ routeSlug: string }> }
) {
  const { routeSlug } = await context.params;

  const routeResult = await db
    .select()
    .from(routes)
    .where(and(eq(routes.slug, routeSlug), eq(routes.enabled, true)))
    .limit(1);

  const route = routeResult[0];

  if (!route) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Route not found or disabled',
      },
      { status: 404 }
    );
  }

  const bodyText = await request.text();
  const contentType = request.headers.get('content-type');

  const insertedEvents = await db
    .insert(events)
    .values({
      userId: route.userId,
      nodeId: route.nodeId,
      routeId: route.id,
      headersJson: encrypt(JSON.stringify(headersToObject(request.headers))),
      bodyText: encrypt(bodyText),
      contentType,
      expiresAt: getDefaultEventExpiryDate(),
    })
    .returning({
      id: events.id,
      status: events.status,
    });

  const event = insertedEvents[0];

  if (isConnected(route.nodeId)) {
    const leaseExpiresAt = new Date(Date.now() + LEASE_DURATION_MS);
    const [leasedEvent] = await db
      .update(events)
      .set({
        status: 'leased',
        attemptCount: sql`${events.attemptCount} + 1`,
        leaseExpiresAt,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, event.id), eq(events.status, 'pending')))
      .returning();

    if (leasedEvent) {
      pushEventToNode(route.nodeId, {
        type: 'event',
        id: leasedEvent.id,
        routeId: leasedEvent.routeId,
        routeSlug,
        headers: JSON.parse(decrypt(leasedEvent.headersJson)) as Record<string, string>,
        body: decrypt(leasedEvent.bodyText ?? ''),
        contentType: leasedEvent.contentType,
        receivedAt: leasedEvent.receivedAt?.toISOString() ?? '',
        leaseExpiresAt: leasedEvent.leaseExpiresAt?.toISOString() ?? '',
        attemptCount: leasedEvent.attemptCount ?? 1,
      });
    }
  }

  return NextResponse.json(
    {
      ok: true,
      eventId: event.id,
      status: event.status,
    },
    { status: 202 }
  );
}

