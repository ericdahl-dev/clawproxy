import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/app/lib/db/client';
import { getDefaultEventExpiryDate } from '@/app/lib/events/expires-at';
import { headersToObject } from '@/app/lib/http/headers';
import { events, routes } from '@/db/schema';

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
      headersJson: headersToObject(request.headers),
      bodyText,
      contentType,
      expiresAt: getDefaultEventExpiryDate(),
    })
    .returning({
      id: events.id,
      status: events.status,
    });

  const event = insertedEvents[0];

  return NextResponse.json(
    {
      ok: true,
      eventId: event.id,
      status: event.status,
    },
    { status: 202 }
  );
}
