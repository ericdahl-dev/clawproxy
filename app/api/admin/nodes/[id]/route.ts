import { and, eq } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { nodes } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
    const { id } = await context.params;

    const deleted = await db
      .delete(nodes)
      .where(and(eq(nodes.id, id), eq(nodes.userId, user.id)))
      .returning({ id: nodes.id });

    if (!deleted[0]) {
      return jsonError('Node not found', 404);
    }

    return jsonOk({});
  });
}
