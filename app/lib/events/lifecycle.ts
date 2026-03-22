import 'server-only';

import { DEFAULT_MAX_RETRY_ATTEMPTS } from '@/app/lib/events/leases';

export function isLeaseExpired(leaseExpiresAt: Date | null, now = new Date()): boolean {
  if (leaseExpiresAt === null) return false;
  return leaseExpiresAt <= now;
}

export function isEventTTLExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt <= now;
}

export function canRetry(attemptCount: number, maxAttempts = DEFAULT_MAX_RETRY_ATTEMPTS): boolean {
  return attemptCount < maxAttempts;
}
