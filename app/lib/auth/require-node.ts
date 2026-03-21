import 'server-only';

import { eq } from 'drizzle-orm';

import { extractBearerToken, hashNodeToken } from '@/app/lib/auth/node-tokens';
import { db } from '@/app/lib/db/client';
import { nodes, type Node } from '@/db/schema';

export async function requireNodeFromRequest(request: Request): Promise<Node> {
  const token = extractBearerToken(request.headers.get('authorization'));

  if (!token) {
    throw new Error('Missing or invalid Authorization header');
  }

  const tokenHash = hashNodeToken(token);
  const result = await db.select().from(nodes).where(eq(nodes.tokenHash, tokenHash)).limit(1);
  const node = result[0];

  if (!node) {
    throw new Error('Invalid node token');
  }

  if (node.status !== 'active') {
    throw new Error('Node is disabled');
  }

  return node;
}
