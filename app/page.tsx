import Link from 'next/link';

import { ArchitectureDiagram } from '@/components/app/architecture-diagram';
import { Button } from '@/components/ui/button';

const proofPoints = [
  'Built for agents',
  'Durable delivery',
  'Private-node friendly',
  'ngrok alternative',
];

const comparisonPoints = [
  {
    title: 'No tunnel dependency',
    description:
      'clawproxy runs as a standalone service. Your node connects outbound, so there is no tunnel daemon to babysit on the receiving end.',
  },
  {
    title: 'Events survive restarts',
    description:
      'Unlike tunnels that drop in-flight traffic when the process exits, clawproxy persists every event until it is acknowledged delivered.',
  },
  {
    title: 'Free while in beta',
    description:
      'clawproxy is free while in beta. It is open source, so you can also run the whole relay yourself.',
  },
];

const featureCards = [
  {
    title: 'Never miss a webhook',
    description:
      'Inbound events are persisted before delivery, so sleeping nodes and deploy restarts do not turn into dropped requests.',
  },
  {
    title: 'Keep your node private',
    description:
      'Designed for hosts behind NAT, residential routers, private LANs, and agent boxes that should only call outbound.',
  },
  {
    title: 'Live WebSocket delivery',
    description:
      'Your node opens a persistent WebSocket connection and receives events when they arrive. Authenticated HTTP pull remains available as fallback.',
  },
  {
    title: 'Built for operators',
    description:
      'Manage routes, inspect recent traffic, retry failures, and understand delivery state from one lightweight dashboard.',
  },
];

const routeFlow = [
  {
    label: 'Expose a public route',
    description:
      'Create a clawproxy route and point GitHub, Stripe, Slack, or any webhook provider at the generated URL.',
  },
  {
    label: 'Queue every inbound event',
    description:
      'Each request is validated, accepted, and stored durably before your private node touches it.',
  },
  {
    label: 'Deliver in real time or on demand',
    description:
      'Your node receives events instantly over WebSocket, or falls back to authenticated HTTP polling when that fits better.',
  },
];

const relayEvents = [
  {
    label: 'Ingress accepted',
    detail: 'GitHub webhook saved before delivery',
  },
  {
    label: 'Node connected',
    detail: 'Outbound WebSocket is ready',
  },
  {
    label: 'Awaiting ack',
    detail: 'Event stays queued until confirmed',
  },
];

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-brand-page text-foreground">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 12% 0%, color-mix(in oklab, var(--color-brand-accent) 24%, transparent), transparent 32%),
            radial-gradient(circle at 88% 14%, color-mix(in oklab, var(--color-brand-accent-muted) 70%, transparent), transparent 34%),
            linear-gradient(180deg, var(--color-brand-page), var(--color-background) 42%, var(--color-brand-page))
          `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-5 pb-20 pt-6 sm:px-8 lg:px-10">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-mono text-[0.78rem] font-semibold tracking-[0.28em] text-brand-accent uppercase">
              clawproxy
            </span>
            <span className="hidden text-sm text-muted-foreground md:inline">
              Public webhook ingress for private agent nodes
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary navigation">
            <a
              href="https://github.com/ericdahl-dev/clawproxy-hermes"
              className="hidden rounded-full border border-border/80 px-4 py-2 text-sm text-foreground/85 transition hover:border-brand-accent/60 hover:text-foreground sm:inline-flex"
            >
              Hermes Agent plugin
            </a>
            <Button asChild size="lg" className="rounded-full px-5 font-semibold">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="grid min-h-[calc(100dvh-5rem)] items-center gap-8 py-9 lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
          <div className="max-w-4xl">
            <p className="max-w-xl font-mono text-xs font-semibold tracking-[0.18em] text-brand-accent uppercase">
              The purpose-built alternative to ngrok and Cloudflare Tunnels
            </p>

            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              Webhooks for private nodes.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Accept public webhook traffic, store it durably, and deliver it to private nodes over outbound WebSocket or pull.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full px-6 py-3 text-sm font-semibold">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-border/90 bg-background/30 px-6 py-3 text-sm font-semibold backdrop-blur"
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border/80 bg-border/80 sm:grid-cols-4">
              {proofPoints.map((item) => (
                <div key={item} className="bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
              Works with Hermes Agent, OpenClaw, and any client that can receive events from an authenticated outbound connection.
              {' '}
              <Link href="/hermes" className="text-brand-accent underline-offset-4 hover:underline">
                Using Hermes?
              </Link>
              {' '}
              <Link href="/openclaw" className="text-brand-accent underline-offset-4 hover:underline">
                Using OpenClaw?
              </Link>
            </p>
          </div>

          <div className="relative w-full max-w-[34rem] lg:justify-self-end">
            <div className="absolute -inset-8 rounded-[3rem] bg-brand-accent/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="border-b border-border/70 p-4">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">route</p>
                    <p className="mt-1.5 font-mono text-sm text-brand-accent">/r/github-to-lab</p>
                  </div>
                  <p className="rounded-full border border-brand-accent/35 bg-brand-accent/10 px-3 py-1 font-mono text-[11px] text-brand-accent">
                    live
                  </p>
                </div>
              </div>

              <div className="p-4">
                <div className="rounded-[1.5rem] border border-brand-accent/25 bg-brand-accent/10 p-4">
                  <p className="font-mono text-xs text-brand-accent">delivery state</p>
                  <h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.04em]">Stored until your node confirms.</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Public providers get a stable endpoint. Private nodes keep control over when work is complete.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70">
                  {relayEvents.map((event, index) => (
                    <div key={event.label} className="bg-background/45 p-3">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-5">{event.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-px overflow-hidden rounded-[2rem] border border-border/80 bg-border/80 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature, index) => (
            <article key={feature.title} className="bg-card/60 p-7 backdrop-blur">
              <p className="font-mono text-xs text-brand-accent">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{feature.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-10 border-b border-border/70 py-20 lg:grid-cols-[0.78fr_1.22fr] lg:py-28">
          <div>
            <h2 className="max-w-lg text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Coming from ngrok or Cloudflare Tunnels?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              ngrok and Cloudflare Tunnels are excellent general-purpose tools, but clawproxy is focused on durable webhook ingress and private node delivery.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-border/80">
            {comparisonPoints.map((point) => (
              <article key={point.title} className="rounded-3xl border border-border/80 bg-card/45 p-6 lg:rounded-none lg:border-0 lg:bg-transparent">
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{point.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{point.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Keep the webhook path public and the node private.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              clawproxy receives inbound webhook traffic on the public internet and hands it to private agent nodes through authenticated outbound requests.
            </p>
          </div>

          <div className="space-y-4">
            {routeFlow.map((step) => (
              <article key={step.label} className="rounded-3xl border border-border/80 bg-card/50 p-6 backdrop-blur">
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{step.label}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-4 lg:py-8">
          <ArchitectureDiagram />
        </section>

        <section className="py-16 lg:py-24">
          <div className="rounded-[2rem] border border-brand-accent/25 bg-brand-accent/10 p-8 backdrop-blur md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Public ingress on one side. Secure outbound delivery on the other.
                </h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Built for the common reality that your software can call out, but should not be exposed directly to the internet.
                </p>
                <p className="mt-4 font-mono text-sm text-brand-accent">clawproxy.io</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full px-6 py-3 text-sm font-semibold">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-border bg-background/30 px-6 py-3 text-sm font-semibold backdrop-blur"
                >
                  <a href="https://github.com/ericdahl-dev/clawproxy-hermes">Hermes Agent plugin</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </section>

      <footer className="border-t border-border/60 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          made by{' '}
          <a href="https://ericdahl.dev" className="underline transition-colors hover:text-foreground">
            ericdahl.dev
          </a>
        </p>
      </footer>
    </main>
  );
}
