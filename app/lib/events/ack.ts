import 'server-only';

export type AckUpdateRow = {
  id: string;
};

export function validateAckEventIds(eventIds: unknown): string[] {
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    throw new Error('eventIds are required');
  }

  const normalized = eventIds.map((value) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error('eventIds must be non-empty strings');
    }

    return value.trim();
  });

  return normalized;
}

export function buildAckSql(nodeId: string, eventIds: string[]) {
  const quotedIds = eventIds.map((id) => `'${id}'`).join(', ');

  return `
    UPDATE events
    SET
      status = 'delivered',
      acked_at = now(),
      updated_at = now()
    WHERE node_id = '${nodeId}'
      AND status = 'leased'
      AND id IN (${quotedIds})
    RETURNING id;
  `;
}

export function summarizeAckedEvents(rows: AckUpdateRow[]) {
  return {
    acked: rows.length,
    eventIds: rows.map((row) => row.id),
  };
}
