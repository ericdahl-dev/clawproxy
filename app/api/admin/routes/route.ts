import { and, desc, eq } from 'drizzle-orm';

import { decrypt } from '@/app/lib/crypto/encryption';
import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { nodes, routes } from '@/db/schema';

function slugifyRouteSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  return withAdminUser(async (user) => {
    const userId = user.id;

    const result = await db
      .select({
        id: routes.id,
        nodeId: routes.nodeId,
        nodeName: nodes.name,
        slug: routes.slug,
        enabled: routes.enabled,
        createdAt: routes.createdAt,
        updatedAt: routes.updatedAt,
      })
      .from(routes)
      .leftJoin(nodes, eq(routes.nodeId, nodes.id))
      .where(eq(routes.userId, userId))
      .orderBy(desc(routes.createdAt));

    return jsonOk({
      routes: result.map((r) => ({ ...r, nodeName: r.nodeName ? decrypt(r.nodeName) : null })),
    });
  });
}

export async function POST(request: Request) {
  return withAdminUser(async (user) => {
    const userId = user.id;
    let body: { nodeId?: string; slug?: string };
    try {
      body = (await request.json()) as { nodeId?: string; slug?: string };
    } catch {
      return jsonError('Invalid JSON body', 400);
    }
    const nodeId = body.nodeId?.trim();
    const slug = body.slug ? slugifyRouteSlug(body.slug) : '';

    if (!nodeId || !slug) {
      return jsonError('nodeId and slug are required', 400);
    }

    const ownedNode = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)))
      .limit(1);

    if (!ownedNode[0]) {
      return jsonError('Node not found', 404);
    }

    const inserted = await db
      .insert(routes)
      .values({
        userId,
        nodeId,
        slug,
      })
      .returning({
        id: routes.id,
        nodeId: routes.nodeId,
        slug: routes.slug,
        enabled: routes.enabled,
        createdAt: routes.createdAt,
      });

    return jsonOk({ route: inserted[0] });
  });
}
