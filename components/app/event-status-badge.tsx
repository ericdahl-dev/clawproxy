import type { EventStatus } from '@/app/lib/dashboard/types';
import { cn } from '@/app/lib/utils';

export const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  pending: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  leased: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  delivered: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  failed: 'border-red-500/30 bg-red-500/15 text-red-400',
  expired: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-400',
};

export const EVENT_STATUS_DOT: Record<EventStatus, string> = {
  pending: 'bg-blue-400',
  leased: 'bg-amber-400',
  delivered: 'bg-emerald-400',
  failed: 'bg-red-400',
  expired: 'bg-zinc-400',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        EVENT_STATUS_STYLES[status],
      )}
    >
      <span className={cn('size-1.5 rounded-full', EVENT_STATUS_DOT[status])} />
      {status}
    </span>
  );
}
