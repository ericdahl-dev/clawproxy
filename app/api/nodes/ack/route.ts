import { NextResponse } from 'next/server';

import { requireNodeFromRequest } from '@/app/lib/auth/require-node';
import { sql } from '@/app/lib/db';
import {
  summarizeAckedEvents,
  validateAckEventIds,
  type AckUpdateRow,
} from '@/app/lib/events/ack';

export async function POST(request: Request) {
  try {
    const node = await requireNodeFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as { eventIds?: unknown };
    const eventIds = validateAckEventIds(body.eventIds);

    const updatedRows = await sql<AckUpdateRow[]>`
      UPDATE events
      SET
        status = 'delivered',
        acked_at = now(),
        updated_at = now()
      WHERE node_id = ${node.id}
        AND status = 'leased'
        AND id IN ${sql(eventIds)}
      RETURNING id
    `;

    return NextResponse.json({
      ok: true,
      ...summarizeAckedEvents(updatedRows),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'eventIds are required' || message === 'eventIds must be non-empty strings' ? 400 : 401;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
