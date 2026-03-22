import { NextResponse } from 'next/server';

import { AuthError, requireNodeFromRequest } from '@/app/lib/auth/require-node';
import { sql } from '@/app/lib/db';
import {
  AckValidationError,
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
    if (error instanceof AckValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
    }

    console.error('Unexpected error in node ack:', error);

    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
