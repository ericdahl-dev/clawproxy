'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import type { DailyEventPoint } from '@/app/lib/dashboard/types';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  events: {
    label: 'Events',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

type Props = {
  data: DailyEventPoint[];
};

export function DashboardEventsChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <AreaChart data={data} accessibilityLayer margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="fillEvents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-events)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-events)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value) => {
            const d = new Date(`${value}T12:00:00.000Z`);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                if (typeof value !== 'string') return String(value);
                return new Date(`${value}T12:00:00.000Z`).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }}
            />
          }
        />
        <Area
          dataKey="events"
          type="monotone"
          fill="url(#fillEvents)"
          stroke="var(--color-events)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
