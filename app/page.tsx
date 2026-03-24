import { ArchitectureDiagram } from '@/components/app/architecture-diagram';
import { Button } from '@/components/ui/button';

const proofPoints = [
  'Built for OpenClaw',
  'Self-hostable',
  'Durable delivery',
  'Private-node friendly',
];

const featureCards = [
  {
    title: 'Never miss a webhook',
    description:
      'Inbound events are persisted before delivery, so temporary downtime or sleeping nodes do not turn into dropped requests.',
  },
  {
    title: 'Keep your node private',
    description:
      'clawproxy is designed for deployments behind NAT, residential routers, and private LANs that can only make outbound connections.',
  },
  {
    title: 'Live WebSocket delivery',
    description:
      'OpenClaw nodes can open a persistent WebSocket connection and receive events the instant they arrive — no polling delay. HTTP pull is always available as a fallback.',
  },
  {
    title: 'Built for operators',
    description:
      'Manage routes, inspect recent traffic, debug failures, and understand delivery state from one lightweight dashboard.',
  },
];

const steps = [
  {
    title: 'Expose a public route',
    description:
      'Create a route in clawproxy and point GitHub, Stripe, Slack, or any provider at the generated URL.',
  },
  {
    title: 'Queue every inbound event',
    description:
      'Each request is validated, accepted, and stored durably before your private node ever touches it.',
  },
  {
    title: 'Deliver in real-time or on demand',
    description:
      'Your OpenClaw node receives events instantly over a persistent WebSocket connection, or falls back to authenticated HTTP polling — whichever fits your setup.',
  },
];

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="text-foreground bg-brand-page min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at top left, color-mix(in oklab, var(--color-brand-accent) 22%, transparent), transparent 32%),
            radial-gradient(circle at top right, color-mix(in oklab, var(--color-brand-accent-muted) 90%, transparent), transparent 36%),
            linear-gradient(180deg, var(--color-brand-page), var(--color-card), var(--color-brand-page))
          `,
        }}
      />
      <div className="bg-brand-accent-muted absolute top-24 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl" />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-24 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
              clawproxy
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Public webhook ingress for private OpenClaw nodes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/openclaw/openclaw"
              className="border-border text-foreground/85 hover:bg-muted/50 hidden rounded-full border px-4 py-2 text-sm transition sm:inline-flex"
            >
              OpenClaw
            </a>
            <Button
              asChild
              size="lg"
              className="rounded-full px-5 shadow-md shadow-black/20"
            >
              <a href="/dashboard">Dashboard</a>
            </Button>
          </div>
        </header>

        <section className="grid items-center gap-16 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="border-brand-accent/25 bg-brand-accent/10 text-brand-accent inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium shadow-lg shadow-black/25 backdrop-blur">
              Stop exposing ports just to receive webhooks
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-[1.02] text-balance sm:text-6xl lg:text-7xl">
              Webhooks for private nodes.
            </h1>

            <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 sm:text-xl">
              Accept webhook traffic from the public internet, store it durably,
              and deliver it to your OpenClaw node instantly over WebSocket — or
              via authenticated outbound pull. No public node exposure required.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full px-6 py-3 text-sm font-semibold shadow-md shadow-black/20"
              >
                <a href="/dashboard">Get started</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-border/80 bg-card/30 px-6 py-3 text-sm font-semibold backdrop-blur"
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {proofPoints.map((item) => (
                <span
                  key={item}
                  className="border-border text-muted-foreground rounded-full border bg-card/40 px-4 py-2 text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="from-brand-accent/20 to-chart-2/15 absolute inset-0 rounded-[2rem] bg-gradient-to-br via-transparent blur-2xl" />
            <div className="border-border bg-card/50 relative rounded-[2rem] border p-4 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
              <div className="border-border bg-card/95 rounded-[1.6rem] border p-5">
                <div className="border-border flex items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <p className="text-brand-accent text-xs font-semibold tracking-[0.28em] uppercase">
                      Live flow
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">From provider to private node</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Healthy
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    {
                      title: 'GitHub / Stripe / Slack',
                      body: 'Webhook hits your public clawproxy route.',
                    },
                    {
                      title: 'Ingress accepted',
                      body: 'Request validated and persisted to the durable queue.',
                    },
                    {
                      title: 'Live push or pull',
                      body: 'Event is pushed instantly over WebSocket, or fetched by the node on its next poll.',
                    },
                    {
                      title: 'Ack complete',
                      body: 'Processed events are acknowledged and marked delivered.',
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="border-border bg-card/60 flex gap-4 rounded-2xl border p-4"
                    >
                      <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm leading-6">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="border-border bg-card/50 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">Mode</p>
                    <p className="mt-2 text-lg font-semibold">Push + Pull</p>
                  </div>
                  <div className="border-border bg-card/50 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">Storage</p>
                    <p className="mt-2 text-lg font-semibold">Durable queue</p>
                  </div>
                  <div className="border-border bg-card/50 rounded-2xl border p-4">
                    <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">Ideal for</p>
                    <p className="mt-2 text-lg font-semibold">NAT + LAN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-border grid gap-6 border-t py-14 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="border-border bg-card/40 rounded-[1.75rem] border p-6 backdrop-blur"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-7">{feature.description}</p>
            </article>
          ))}
        </section>

        <section
          id="how-it-works"
          className="grid gap-10 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-16"
        >
          <div>
            <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Keep the webhook path public and the node private.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7">
              clawproxy is deliberately focused: it receives inbound webhook
              traffic on the public internet and hands it off to private
              OpenClaw nodes through authenticated outbound requests.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="border-border bg-card/40 flex items-start gap-4 rounded-[1.75rem] border p-5"
              >
                <div className="border-border bg-muted/50 text-brand-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-7">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-6 lg:py-10">
          <ArchitectureDiagram />
        </section>

        <section className="py-8">
          <div className="border-brand-accent/20 from-brand-accent/12 via-card/50 to-chart-2/12 rounded-[2rem] border bg-gradient-to-r p-8 backdrop-blur">
            <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
              Ready to route inbound events?
            </p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold sm:text-4xl">
                  Public ingress on one side. Secure outbound delivery on the other.
                </h2>
                <p className="text-muted-foreground mt-4 text-base leading-7">
                  Built for the very common reality that your software can call out,
                  but should not be exposed directly to the internet.
                </p>
                <p className="text-muted-foreground mt-3 text-sm">clawproxy.io</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-6 py-3 text-sm font-semibold"
                >
                  <a href="/dashboard">Open dashboard</a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-border px-6 py-3 text-sm font-semibold"
                >
                  <a href="https://github.com/openclaw/openclaw">Learn about OpenClaw</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <footer className="border-border/40 border-t py-6 text-center">
        <p className="text-muted-foreground text-sm">
          made by{' '}
          <a
            href="https://ericdahl.dev"
            className="hover:text-foreground underline transition-colors"
          >
            ericdahl.dev
          </a>
        </p>
      </footer>
    </main>
  );
}
