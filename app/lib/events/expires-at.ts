import 'server-only';

const DEFAULT_EVENT_TTL_HOURS = 24;

export function getDefaultEventExpiryDate(now = new Date()): Date {
  return new Date(now.getTime() + DEFAULT_EVENT_TTL_HOURS * 60 * 60 * 1000);
}
