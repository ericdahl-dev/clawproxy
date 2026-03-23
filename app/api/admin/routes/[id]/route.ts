import { and, eq } from 'drizzle-orm';

import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { routes } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
    const { id } = await context.params;

    const deleted = await db
      .delete(routes)
      .where(and(eq(routes.id, id), eq(routes.userId, user.id)))
      .returning({ id: routes.id });

    if (!deleted[0]) {
      return jsonError('Route not found', 404);
    }

    return jsonOk({});
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
    const { id } = await context.params;

    let body: { enabled?: boolean };
    try {
      body = (await request.json()) as { enabled?: boolean };
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    if (typeof body.enabled !== 'boolean') {
      return jsonError('enabled (boolean) is required', 400);
    }

    const updated = await db
      .update(routes)
      .set({ enabled: body.enabled, updatedAt: new Date() })
      .where(and(eq(routes.id, id), eq(routes.userId, user.id)))
      .returning({ id: routes.id, enabled: routes.enabled });

    if (!updated[0]) {
      return jsonError('Route not found', 404);
    }

    return jsonOk({ route: updated[0] });
  });
}
