import Link from 'next/link';

import { formatRelativeTime } from '@/app/lib/dashboard/datetime';
import type { EventStatus } from '@/app/lib/dashboard/types';
import { EventStatusBadge } from '@/components/app/event-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type DashboardRecentEventRow = {
  id: string;
  status: EventStatus;
  nodeName: string | null;
  contentType: string | null;
  receivedAt: Date | string;
};

type Props = {
  events: DashboardRecentEventRow[];
};

export function DashboardRecentEvents({ events: rows }: Props) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Recent events</CardTitle>
          <CardDescription>Latest webhook deliveries across your nodes.</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/events">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="text-muted-foreground px-4 pb-2 text-sm">
            No events yet. Traffic will show up here after your routes receive webhooks.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/50 bg-muted/30 border-y">
                  <th className="text-muted-foreground px-4 py-2 text-left text-xs font-medium">
                    Status
                  </th>
                  <th className="text-muted-foreground px-4 py-2 text-left text-xs font-medium">
                    Node
                  </th>
                  <th className="text-muted-foreground px-4 py-2 text-left text-xs font-medium">
                    Type
                  </th>
                  <th className="text-muted-foreground px-4 py-2 text-right text-xs font-medium">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => (
                  <tr key={event.id} className="border-border/40 border-b last:border-b-0">
                    <td className="px-4 py-2.5">
                      <EventStatusBadge status={event.status} />
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2.5 font-medium">
                      {event.nodeName ?? '—'}
                    </td>
                    <td className="text-muted-foreground max-w-[120px] truncate px-4 py-2.5 font-mono text-xs">
                      {event.contentType ?? '—'}
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 text-right tabular-nums">
                      {formatRelativeTime(event.receivedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
