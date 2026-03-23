'use client';

import { useCallback, useState } from 'react';

import { formatRelativeTime, formatTimestamp } from '@/app/lib/dashboard/datetime';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EventStatus = 'pending' | 'leased' | 'delivered' | 'failed' | 'expired';

type EventRow = {
  id: string;
  nodeId: string;
  nodeName: string | null;
  routeId: string;
  status: EventStatus;
  contentType: string | null;
  receivedAt: Date | string;
  leaseExpiresAt: Date | string | null;
  attemptCount: number;
  ackedAt: Date | string | null;
  expiresAt: Date | string;
  createdAt: Date | string;
};

type EventDetail = EventRow & {
  headersJson: unknown;
  bodyText: string;
  updatedAt: Date | string;
};

type NodeOption = {
  id: string;
  name: string;
};

type Props = {
  initialEvents: EventRow[];
  availableNodes: NodeOption[];
};

const ALL_STATUSES: EventStatus[] = ['pending', 'leased', 'delivered', 'failed', 'expired'];

const STATUS_STYLES: Record<EventStatus, string> = {
  pending: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  leased: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  delivered: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  failed: 'border-red-500/30 bg-red-500/15 text-red-400',
  expired: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-400',
};

const STATUS_DOT: Record<EventStatus, string> = {
  pending: 'bg-blue-400',
  leased: 'bg-amber-400',
  delivered: 'bg-emerald-400',
  failed: 'bg-red-400',
  expired: 'bg-zinc-400',
};

const DATE_RANGES = [
  { label: 'All time', value: '' },
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
];

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      <span className={cn('size-1.5 rounded-full', STATUS_DOT[status])} />
      {status}
    </span>
  );
}

export function EventsClient({ initialEvents, availableNodes }: Props) {
  const [eventList, setEventList] = useState<EventRow[]>(initialEvents);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EventStatus>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState<boolean>(false);

  const fetchEvents = useCallback(
    async (
      statuses: Set<EventStatus>,
      nodeId: string,
      range: string,
      currentOffset: number,
    ) => {
      setLoading(true);
      setFetchError(null);

      try {
        const params = new URLSearchParams();
        if (statuses.size > 0) params.set('status', [...statuses].join(','));
        if (nodeId) params.set('nodeId', nodeId);
        if (range) params.set('dateRange', range);
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(currentOffset));

        const res = await fetch(`/api/admin/events?${params.toString()}`, {
          credentials: 'same-origin',
        });
        const data = (await res.json()) as {
          ok: boolean;
          events?: EventRow[];
          error?: string;
        };

        if (!data.ok || !data.events) {
          setFetchError(data.error ?? 'Failed to load events.');
          return;
        }

        setEventList(data.events);
      } catch {
        setFetchError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  function toggleStatus(status: EventStatus) {
    const next = new Set(selectedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    setSelectedStatuses(next);
    setOffset(0);
    void fetchEvents(next, selectedNodeId, dateRange, 0);
  }

  function handleNodeChange(nodeId: string) {
    setSelectedNodeId(nodeId);
    setOffset(0);
    void fetchEvents(selectedStatuses, nodeId, dateRange, 0);
  }

  function handleDateRangeChange(range: string) {
    setDateRange(range);
    setOffset(0);
    void fetchEvents(selectedStatuses, selectedNodeId, range, 0);
  }

  function handlePrevPage() {
    const newOffset = Math.max(0, offset - PAGE_SIZE);
    setOffset(newOffset);
    void fetchEvents(selectedStatuses, selectedNodeId, dateRange, newOffset);
  }

  function handleNextPage() {
    const newOffset = offset + PAGE_SIZE;
    setOffset(newOffset);
    void fetchEvents(selectedStatuses, selectedNodeId, dateRange, newOffset);
  }

  async function handleRowClick(event: EventRow) {
    setSelectedEvent(null);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const res = await fetch(`/api/admin/events/${event.id}`, { credentials: 'same-origin' });
      const data = (await res.json()) as {
        ok: boolean;
        event?: EventDetail;
        error?: string;
      };

      if (!data.ok || !data.event) {
        setDetailError(data.error ?? 'Failed to load event details.');
        setDetailLoading(false);
        return;
      }

      setSelectedEvent(data.event);
    } catch {
      setDetailError('Failed to load event details. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRetry(eventId: string) {
    setRetryLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/retry`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setDetailError(data.error ?? 'Failed to retry event.');
        return;
      }
      setSelectedEvent(null);
      void fetchEvents(selectedStatuses, selectedNodeId, dateRange, offset);
    } catch {
      setDetailError('Failed to retry event. Please try again.');
    } finally {
      setRetryLoading(false);
    }
  }

  const hasMore = eventList.length === PAGE_SIZE;
  const hasPrev = offset > 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition',
                selectedStatuses.has(status)
                  ? STATUS_STYLES[status]
                  : 'border-border/50 text-muted-foreground hover:border-border',
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  selectedStatuses.has(status) ? STATUS_DOT[status] : 'bg-muted-foreground/50',
                )}
              />
              {status}
            </button>
          ))}
        </div>

        {availableNodes.length > 0 && (
          <select
            value={selectedNodeId}
            onChange={(e) => handleNodeChange(e.target.value)}
            className="border-input bg-background text-foreground focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
          >
            <option value="">All nodes</option>
            {availableNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={dateRange}
          onChange={(e) => handleDateRangeChange(e.target.value)}
          className="border-input bg-background text-foreground focus-visible:ring-ring rounded-md border px-3 py-1.5 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {fetchError && <p className="text-destructive text-sm">{fetchError}</p>}

      {eventList.length === 0 && !loading ? (
        <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
          <p className="text-muted-foreground text-sm">No delivery events are available yet.</p>
        </div>
      ) : (
        <div className="border-border/70 bg-background/40 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/50 border-b">
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Status</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Node</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">
                  Content type
                </th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Received</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Expires</th>
                <th className="text-muted-foreground px-5 py-3 text-left font-medium">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-5 py-8 text-center text-sm">
                    Loading…
                  </td>
                </tr>
              ) : (
                eventList.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => void handleRowClick(event)}
                    className="border-border/30 hover:bg-muted/30 cursor-pointer border-b last:border-b-0 transition"
                  >
                    <td className="px-5 py-3">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-5 py-3 font-medium">{event.nodeName ?? '—'}</td>
                    <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                      {event.contentType ?? '—'}
                    </td>
                    <td className="text-muted-foreground px-5 py-3">
                      {formatRelativeTime(event.receivedAt)}
                    </td>
                    <td className="text-muted-foreground px-5 py-3">
                      {formatRelativeTime(event.expiresAt)}
                    </td>
                    <td className="text-muted-foreground px-5 py-3">{event.attemptCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasMore) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev || loading}
            onClick={handlePrevPage}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Showing {offset + 1}–{offset + eventList.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={handleNextPage}
          >
            Next
          </Button>
        </div>
      )}

      {(detailLoading || detailError !== null || selectedEvent !== null) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEvent(null);
              setDetailError(null);
            }
          }}
        >
          <div className="border-border/80 bg-card max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl">
            {detailLoading ? (
              <p className="text-muted-foreground text-sm">Loading event details…</p>
            ) : detailError ? (
              <>
                <p className="text-destructive text-sm">{detailError}</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailError(null)}
                >
                  Close
                </Button>
              </>
            ) : selectedEvent ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Event details</h3>
                  <div className="flex items-center gap-2">
                    {(selectedEvent.status === 'failed' || selectedEvent.status === 'expired') && (
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={retryLoading}
                        onClick={() => void handleRetry(selectedEvent.id)}
                      >
                        {retryLoading ? 'Retrying…' : 'Retry'}
                      </Button>
                    )}
                    <Button variant="outline" size="xs" onClick={() => setSelectedEvent(null)}>
                      Close
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedEvent.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Node</p>
                    <p className="mt-1 text-sm font-medium">{selectedEvent.nodeName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Attempts</p>
                    <p className="mt-1 text-sm font-medium">{selectedEvent.attemptCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Received</p>
                    <p className="mt-1 text-sm">{formatTimestamp(selectedEvent.receivedAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Expires</p>
                    <p className="mt-1 text-sm">{formatTimestamp(selectedEvent.expiresAt)}</p>
                  </div>
                  {selectedEvent.ackedAt && (
                    <div>
                      <p className="text-muted-foreground text-xs">Acknowledged</p>
                      <p className="mt-1 text-sm">{formatTimestamp(selectedEvent.ackedAt)}</p>
                    </div>
                  )}
                  {selectedEvent.leaseExpiresAt && (
                    <div>
                      <p className="text-muted-foreground text-xs">Lease expires</p>
                      <p className="mt-1 text-sm">
                        {formatTimestamp(selectedEvent.leaseExpiresAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <p className="mb-1.5 text-xs font-medium">Headers</p>
                  <pre className="border-border/60 bg-background/60 max-h-48 overflow-auto rounded-lg border p-3 text-xs leading-relaxed">
                    {JSON.stringify(selectedEvent.headersJson, null, 2)}
                  </pre>
                </div>

                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium">Body</p>
                  <pre className="border-border/60 bg-background/60 max-h-48 overflow-auto rounded-lg border p-3 text-xs leading-relaxed">
                    {selectedEvent.bodyText || '(empty)'}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
