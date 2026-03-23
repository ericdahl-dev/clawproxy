import { and, eq } from 'drizzle-orm';

import { generateNodeToken } from '@/app/lib/auth/node-tokens';
import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { nodes } from '@/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminUser(async (user) => {
    const { id } = await params;

    const { token, tokenHash } = generateNodeToken();

    const updated = await db
      .update(nodes)
      .set({ tokenHash, updatedAt: new Date() })
      .where(and(eq(nodes.id, id), eq(nodes.userId, user.id)))
      .returning({ id: nodes.id });

    if (updated.length === 0) {
      return jsonError('Node not found', 404);
    }

    return jsonOk({ token });
  });
}
