import type { Sql } from 'postgres';

/**
 * Record that a node was just heard from. Takes the db client as a parameter so the
 * custom WebSocket server (which cannot import `server-only` modules) can share it.
 */
export async function markNodeSeen(sql: Sql, nodeId: string): Promise<void> {
  await sql`
    UPDATE nodes
    SET last_seen_at = now(), updated_at = now()
    WHERE id = ${nodeId}
  `;
}
