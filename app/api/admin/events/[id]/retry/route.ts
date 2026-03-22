import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { events } from '@/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminUser();
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
      return NextResponse.json(
        { ok: false, error: 'Event not found or not retryable' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
