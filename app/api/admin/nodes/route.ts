import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { generateNodeToken } from '@/app/lib/auth/node-tokens';
import { decrypt, encrypt } from '@/app/lib/crypto/encryption';
import { db } from '@/app/lib/db/client';
import { jsonError, jsonOk, withAdminUser } from '@/app/lib/http/admin-json';
import { nodes } from '@/db/schema';

export const dynamic = 'force-dynamic';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

function slugifyNodeName(name: string) {
  return name
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

    return jsonOk({
      nodes: result.map((n) => ({ ...n, name: decrypt(n.name) })),
    });
  });
}

export async function POST(request: Request) {
  return withAdminUser(async (user) => {
    const userId = user.id;

    let body: { name?: string; slug?: string };
    try {
      body = (await request.json()) as { name?: string; slug?: string };
    } catch {
      return jsonError('Invalid JSON body', 400);
    }

    const name = body.name?.trim();

    if (!name) {
      return jsonError('Name is required', 400);
    }

    const slug = body.slug?.trim() || slugifyNodeName(name);

    if (!slug) {
      return jsonError('Slug is required', 400);
    }

    const { token, tokenHash } = generateNodeToken();

    try {
      const inserted = await db
        .insert(nodes)
        .values({
          userId,
          name: encrypt(name),
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

      const node = inserted[0];
      return NextResponse.json({
        ok: true,
        node: { ...node, name: decrypt(node.name) },
        token,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return jsonError('That slug is already in use. Choose a different slug.', 409);
      }
      console.error('[POST /api/admin/nodes] insert failed', error);
      return jsonError(
        'Could not create node. Check your database connection and try again.',
        500,
      );
    }
  });
}
