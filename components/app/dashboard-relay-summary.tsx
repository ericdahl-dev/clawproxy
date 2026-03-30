import { ArrowRightLeft, RadioTower, ShieldCheck, Sparkles } from 'lucide-react';

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
    <Card size="sm" className="overflow-hidden border-brand-accent/20 bg-gradient-to-br from-brand-accent/10 via-background to-background">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="p-5 md:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent">
              <Sparkles className="size-3.5" aria-hidden />
              Live relay console
            </div>
            <h3 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight">
              Public webhooks on one side, Hermes Agent and OpenClaw on the other.
            </h3>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6">
              Keep the relay legible at a glance: confirm traffic is arriving, private nodes are
              reachable, and failed deliveries can be pushed back into motion quickly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="border-border/70 bg-background/80 rounded-full border px-3 py-1 font-medium">
                Secure ingress
              </span>
              <span className="border-border/70 bg-background/80 rounded-full border px-3 py-1 font-medium">
                Lease + ack delivery
              </span>
              <span className="border-border/70 bg-background/80 rounded-full border px-3 py-1 font-medium">
                WebSocket first
              </span>
              <span className="border-border/70 bg-background/80 rounded-full border px-3 py-1 font-medium">
                HTTP fallback
              </span>
            </div>
          </div>

          <div className="border-border/60 bg-background/70 border-t p-5 md:p-6 lg:border-t-0 lg:border-l">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {summaryItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="border-border/60 bg-card/70 rounded-2xl border p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-brand-accent/10 text-brand-accent flex size-8 shrink-0 items-center justify-center rounded-xl border border-brand-accent/15">
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
