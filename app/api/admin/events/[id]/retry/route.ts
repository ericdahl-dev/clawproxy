import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { events } from '@/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
    const { id } = await params;

    const updated = await db
      .update(events)
      .set({
        status: 'pending',
        leaseExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(events.id, id),
          eq(events.userId, user.id),
          inArray(events.status, ['failed', 'expired']),
        ),
      )
      .returning({ id: events.id });

    if (updated.length === 0) {
      return jsonError('Event not found or not retryable', 404);
    }

    return jsonOk({});
  });
}
