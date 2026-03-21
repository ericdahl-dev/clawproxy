import { NextResponse } from 'next/server';

import { requireNodeFromRequest } from '@/app/lib/auth/require-node';

export async function POST(request: Request) {
  try {
    const node = await requireNodeFromRequest(request);

    return NextResponse.json({
      ok: true,
      nodeId: node.id,
      status: 'authenticated',
      events: [],
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
