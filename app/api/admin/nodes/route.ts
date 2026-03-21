import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { generateNodeToken } from '@/app/lib/auth/node-tokens';
import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes } from '@/db/schema';

function slugifyNodeName(name: string) {
  return name
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
        id: nodes.id,
        name: nodes.name,
        slug: nodes.slug,
        status: nodes.status,
        lastSeenAt: nodes.lastSeenAt,
        createdAt: nodes.createdAt,
        updatedAt: nodes.updatedAt,
      })
      .from(nodes)
      .where(eq(nodes.userId, userId))
      .orderBy(desc(nodes.createdAt));

    return NextResponse.json({ ok: true, nodes: result });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    const userId = user.id;
    const body = (await request.json()) as { name?: string; slug?: string };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });
    }

    const slug = body.slug?.trim() || slugifyNodeName(name);

    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Slug is required' }, { status: 400 });
    }

    const { token, tokenHash } = generateNodeToken();

    const inserted = await db
      .insert(nodes)
      .values({
        userId,
        name,
        slug,
        tokenHash,
      })
      .returning({
        id: nodes.id,
        name: nodes.name,
        slug: nodes.slug,
        status: nodes.status,
        createdAt: nodes.createdAt,
      });

    return NextResponse.json({
      ok: true,
      node: inserted[0],
      token,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
