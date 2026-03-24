import type { ComponentType } from 'react';

import {
  Activity,
  Archive,
  CheckCircle2,
  Clock,
  Inbox,
  Percent,
  Send,
  XCircle,
} from 'lucide-react';

import { cn } from '@/app/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type DashboardMetricSnapshot = {
  total: number;
  successRate: number;
  delivered: number;
  failed: number;
  pending: number;
  leased: number;
  expired: number;
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  valueClassName,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn('text-2xl font-semibold tabular-nums', valueClassName)}>{value}</div>
        <CardDescription className="mt-1 text-xs leading-snug">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function DashboardMetricCards({
  total,
  successRate,
  delivered,
  failed,
  pending,
  leased,
  expired,
}: DashboardMetricSnapshot) {
  const inFlight = pending + leased;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Event metrics</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Snapshot of webhook events stored for your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total events"
          value={total}
          description="All statuses in your queue history."
          icon={Inbox}
        />
        <MetricCard
          title="Success rate"
          value={`${successRate}%`}
          description="Delivered as a share of all events."
          icon={Percent}
        />
        <MetricCard
          title="Delivered"
          value={delivered}
          description="Completed end-to-end delivery."
          icon={CheckCircle2}
          valueClassName="text-emerald-500 dark:text-emerald-400"
        />
        <MetricCard
          title="Failed"
          value={failed}
          description={
            failed > 0 ? 'Inspect failures under Events.' : 'No failed deliveries recorded.'
          }
          icon={XCircle}
          valueClassName={cn(failed > 0 && 'text-red-500 dark:text-red-400')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="In flight"
          value={inFlight}
          description="Pending plus leased (actively worked)."
          icon={Activity}
          valueClassName="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          title="Pending"
          value={pending}
          description="Waiting to be leased or delivered."
          icon={Clock}
        />
        <MetricCard
          title="Leased"
          value={leased}
          description="Checked out for delivery to your node."
          icon={Send}
        />
        <MetricCard
          title="Expired"
          value={expired}
          description="Dropped after the retention window."
          icon={Archive}
        />
      </div>
    </div>
  );
}
