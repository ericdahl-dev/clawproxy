import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { generateNodeToken } from '@/app/lib/auth/node-tokens';
import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { nodes } from '@/db/schema';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdminUser();
    const { id } = await params;

    const { token, tokenHash } = generateNodeToken();

    const updated = await db
      .update(nodes)
      .set({ tokenHash, updatedAt: new Date() })
      .where(and(eq(nodes.id, id), eq(nodes.userId, user.id)))
      .returning({ id: nodes.id });

    if (updated.length === 0) {
      return NextResponse.json({ ok: false, error: 'Node not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}
