import 'server-only';

export type AckUpdateRow = {
  id: string;
};

export class AckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AckValidationError';
  }
}

export function validateAckEventIds(eventIds: unknown): string[] {
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    throw new AckValidationError('eventIds are required');
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of eventIds) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new AckValidationError('eventIds must be non-empty strings');
    }

    const trimmed = value.trim();

    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      normalized.push(trimmed);
    }
  }

  return normalized;
}

export function summarizeAckedEvents(rows: AckUpdateRow[]) {
  return {
    acked: rows.length,
    eventIds: rows.map((row) => row.id),
  };
}
