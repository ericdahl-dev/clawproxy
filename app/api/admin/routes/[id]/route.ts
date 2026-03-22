import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { requireAdminUser } from '@/app/lib/auth/require-admin';
import { db } from '@/app/lib/db/client';
import { routes } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdminUser();
    const { id } = await context.params;

    const deleted = await db
      .delete(routes)
      .where(and(eq(routes.id, id), eq(routes.userId, user.id)))
      .returning({ id: routes.id });

    if (!deleted[0]) {
      return NextResponse.json({ ok: false, error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  let user;
  let id: string;

  try {
    user = await requireAdminUser();
    ({ id } = await context.params);
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { enabled?: boolean };
  try {
    body = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: 'enabled (boolean) is required' },
      { status: 400 }
    );
  }

  const updated = await db
    .update(routes)
    .set({ enabled: body.enabled, updatedAt: new Date() })
    .where(and(eq(routes.id, id), eq(routes.userId, user.id)))
    .returning({ id: routes.id, enabled: routes.enabled });

  if (!updated[0]) {
    return NextResponse.json({ ok: false, error: 'Route not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, route: updated[0] });
}
