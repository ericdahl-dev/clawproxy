import { and, eq } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { decrypt } from '@/app/lib/crypto/encryption';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { events, nodes } from '@/db/schema';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
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
      return jsonError('Event not found', 404);
    }

    const row = result[0];
    const event = {
      ...row,
      nodeName: row.nodeName ? decrypt(row.nodeName) : null,
      headersJson: JSON.parse(decrypt(row.headersJson)) as Record<string, string>,
      bodyText: decrypt(row.bodyText),
    };

    return jsonOk({ event });
  });
}
