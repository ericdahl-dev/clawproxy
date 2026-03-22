import 'server-only';

export const DEFAULT_LEASE_DURATION_SECONDS = 60;
export const DEFAULT_MAX_PULL_EVENTS = 10;
export const MAX_PULL_EVENTS = 100;

export function clampMaxPullEvents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MAX_PULL_EVENTS;
  }

  const normalized = Math.floor(value);

  if (normalized < 1) {
    return 1;
  }

  if (normalized > MAX_PULL_EVENTS) {
    return MAX_PULL_EVENTS;
  }

  return normalized;
}
