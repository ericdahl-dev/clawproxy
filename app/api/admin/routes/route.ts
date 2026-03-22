import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes, routes } from '@/db/schema';

function slugifyRouteSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const user = await requireAdminUser();
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

    return NextResponse.json({ ok: true, routes: result });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const userId = user.id;
    const body = (await request.json()) as { nodeId?: string; slug?: string };
    const nodeId = body.nodeId?.trim();
    const slug = body.slug ? slugifyRouteSlug(body.slug) : '';

    if (!nodeId || !slug) {
      return NextResponse.json(
        { ok: false, error: 'nodeId and slug are required' },
        { status: 400 }
      );
    }

    const ownedNode = await db
      .select({ id: nodes.id })
      .from(nodes)
      .where(and(eq(nodes.id, nodeId), eq(nodes.userId, userId)))
      .limit(1);

    if (!ownedNode[0]) {
      return NextResponse.json({ ok: false, error: 'Node not found' }, { status: 404 });
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

    return NextResponse.json({ ok: true, route: inserted[0] });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
