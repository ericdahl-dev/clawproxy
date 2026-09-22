import { ArrowRightLeft, RadioTower, ShieldCheck } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

const summaryItems = [
  {
    icon: RadioTower,
    title: 'Public ingress',
    description: 'Webhook POSTs land on a stable public endpoint and are retained safely.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Delivery path',
    description: 'Nodes prefer WebSocket push and fall back to HTTP pull when needed.',
  },
  {
    icon: ShieldCheck,
    title: 'Private consumers',
    description: 'Built for Hermes Agent and OpenClaw running behind NAT or on a LAN.',
  },
] as const;

export function DashboardRelaySummary() {
  return (
    <Card
      size="sm"
      className="overflow-hidden border-brand-accent/25 bg-brand-accent/10 shadow-2xl shadow-black/25"
    >
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="p-5 md:p-6">
            <div className="inline-flex items-center rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 font-mono text-xs font-medium text-brand-accent">
              Live relay console
            </div>
            <h3 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em]">
              Public webhooks on one side, Hermes Agent and OpenClaw on the other.
            </h3>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
              Keep the relay legible at a glance: confirm traffic is arriving, private nodes are
              reachable, and failed deliveries can be pushed back into motion quickly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="border-border/70 bg-background/45 rounded-full border px-3 py-1 font-medium">
                Secure ingress
              </span>
              <span className="border-border/70 bg-background/45 rounded-full border px-3 py-1 font-medium">
                Lease + ack delivery
              </span>
              <span className="border-border/70 bg-background/45 rounded-full border px-3 py-1 font-medium">
                WebSocket first
              </span>
              <span className="border-border/70 bg-background/45 rounded-full border px-3 py-1 font-medium">
                HTTP fallback
              </span>
            </div>
          </div>

          <div className="border-border/70 bg-background/35 border-t p-5 md:p-6 lg:border-t-0 lg:border-l">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {summaryItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-border/70 bg-card/55 p-4 shadow-lg shadow-black/10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-brand-accent/25 bg-brand-accent/10 text-brand-accent">
                        <Icon className="size-4" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
