import { NextResponse } from 'next/server';

import { requireNodeFromRequest } from '@/app/lib/auth/require-node';
import {
  clampMaxPullEvents,
  DEFAULT_LEASE_DURATION_SECONDS,
  DEFAULT_MAX_RETRY_ATTEMPTS,
} from '@/app/lib/events/leases';
import { sql } from '@/app/lib/db';

type PullEventRow = {
  id: string;
  routeId: string;
  routeSlug: string;
  headers: Record<string, string>;
  body: string;
  contentType: string | null;
  receivedAt: string;
  leaseExpiresAt: string;
  attemptCount: number;
};

export async function POST(request: Request) {
  try {
    const node = await requireNodeFromRequest(request);
    const body = (await request.json().catch(() => ({}))) as { maxEvents?: number };
    const maxEvents = clampMaxPullEvents(body.maxEvents);

    await sql`
      UPDATE nodes
      SET last_seen_at = now(), updated_at = now()
      WHERE id = ${node.id}
    `;

    await sql`
      UPDATE events
      SET status = 'expired', updated_at = now()
      WHERE node_id = ${node.id}
        AND status IN ('pending', 'leased')
        AND expires_at <= now()
    `;

    const events = await sql<PullEventRow[]>`
      WITH candidate_events AS (
        SELECT e.id
        FROM events e
        WHERE e.node_id = ${node.id}
          AND e.expires_at > now()
          AND e.attempt_count < ${DEFAULT_MAX_RETRY_ATTEMPTS}
          AND (
            e.status = 'pending'
            OR (e.status = 'leased' AND e.lease_expires_at IS NOT NULL AND e.lease_expires_at <= now())
          )
        ORDER BY e.received_at ASC
        LIMIT ${maxEvents}
      )
      UPDATE events e
      SET
        status = 'leased',
        lease_expires_at = now() + (${DEFAULT_LEASE_DURATION_SECONDS} * interval '1 second'),
        attempt_count = e.attempt_count + 1,
        updated_at = now()
      FROM candidate_events c
      WHERE e.id = c.id
      RETURNING
        e.id,
        e.route_id AS "routeId",
        (
          SELECT r.slug
          FROM routes r
          WHERE r.id = e.route_id
        ) AS "routeSlug",
        e.headers_json AS headers,
        e.body_text AS body,
        e.content_type AS "contentType",
        e.received_at::text AS "receivedAt",
        e.lease_expires_at::text AS "leaseExpiresAt",
        e.attempt_count AS "attemptCount"
    `;

    return NextResponse.json({
      ok: true,
      nodeId: node.id,
      events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 401 }
    );
  }
}

