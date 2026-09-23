import Link from 'next/link';

import { ArchitectureDiagram } from '@/components/app/architecture-diagram';
import { Button } from '@/components/ui/button';

const openClawUseCases = [
  {
    title: 'GitHub events reach your local automation',
    description:
      'Point repositories at one public clawproxy route while OpenClaw runs privately on a lab box, workstation, or Coolify service.',
  },
  {
    title: 'Durable delivery for sleeping workers',
    description:
      'clawproxy stores every accepted webhook until your OpenClaw node reconnects, pulls the event, and acknowledges it.',
  },
  {
    title: 'No inbound firewall changes',
    description:
      'The OpenClaw node initiates an outbound WebSocket or pull connection, so you do not expose SSH, dashboards, or agent ports.',
  },
];

const setupSteps = [
  'Create a node token in the clawproxy dashboard.',
  'Create a route for each provider or workflow.',
  'Configure OpenClaw with the relay URL and node token.',
  'Send GitHub, Stripe, and Slack webhooks to the generated route URL.',
];

const snippetLines = [
  'OPENCLAW_WEBHOOK_RELAY_URL=wss://clawproxy.io/api/nodes/ws',
  'OPENCLAW_WEBHOOK_NODE_TOKEN=cpn_your_node_token',
  'OPENCLAW_WEBHOOK_ROUTE_URL=https://clawproxy.io/api/ingress/github-to-openclaw',
];

export const dynamic = 'force-dynamic';

export default function OpenClawLandingPage() {
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
              Webhook relay for OpenClaw workflows
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary navigation">
            <Link
              href="/"
              className="hidden rounded-full border border-border/80 px-4 py-2 text-sm text-foreground/85 transition hover:border-brand-accent/60 hover:text-foreground sm:inline-flex"
            >
              Main landing
            </Link>
            <Button asChild size="lg" className="rounded-full px-5 font-semibold">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </header>

        <section className="grid min-h-[calc(100dvh-5rem)] items-center gap-8 py-9 lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
          <div className="max-w-4xl">
            <p className="max-w-xl font-mono text-xs font-semibold tracking-[0.18em] text-brand-accent uppercase">
              Built for private OpenClaw nodes
            </p>

            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
              Public webhooks for OpenClaw workflows.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              clawproxy is the webhook relay for OpenClaw workflows: accept provider events on the
              public internet, queue them safely, and deliver them to a private OpenClaw node over an
              outbound WebSocket or pull connection.
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
                <a href="#setup">Copy setup snippet</a>
              </Button>
            </div>
          </div>

          <div className="relative w-full max-w-[34rem] lg:justify-self-end">
            <div className="absolute -inset-8 rounded-[3rem] bg-brand-accent/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="border-b border-border/70 p-4">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">openclaw route</p>
                    <p className="mt-1.5 font-mono text-sm text-brand-accent">/api/ingress/github-to-openclaw</p>
                  </div>
                  <p className="rounded-full border border-brand-accent/35 bg-brand-accent/10 px-3 py-1 font-mono text-[11px] text-brand-accent">
                    queued
                  </p>
                </div>
              </div>

              <div className="p-4">
                <div className="rounded-[1.5rem] border border-brand-accent/25 bg-brand-accent/10 p-4">
                  <p className="font-mono text-xs text-brand-accent">delivery path</p>
                  <h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.04em]">
                    Provider event in. OpenClaw action out.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    GitHub, Stripe, and Slack webhooks get a stable public endpoint while OpenClaw
                    keeps processing private behind NAT.
                  </p>
                </div>

                <div className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-3">
                  {['Ingress accepted', 'Queued safely', 'OpenClaw acked'].map((label, index) => (
                    <div key={label} className="bg-background/45 p-3">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-px overflow-hidden rounded-[2rem] border border-border/80 bg-border/80 md:grid-cols-3">
          {openClawUseCases.map((useCase, index) => (
            <article key={useCase.title} className="bg-card/60 p-7 backdrop-blur">
              <p className="font-mono text-xs text-brand-accent">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{useCase.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{useCase.description}</p>
            </article>
          ))}
        </section>

        <section id="setup" className="grid gap-10 border-b border-border/70 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:py-28">
          <div>
            <h2 className="max-w-lg text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Wire OpenClaw to clawproxy in minutes.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Start with one route, verify delivery, then add more provider workflows without changing
              how your OpenClaw node reaches the public internet.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="rounded-3xl border border-border/80 bg-card/50 p-6 backdrop-blur">
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-brand-accent uppercase">
                OpenClaw env
              </p>
              <pre className="mt-5 overflow-x-auto rounded-2xl border border-border/80 bg-background/50 p-5 text-sm leading-7 text-foreground">
                <code>{snippetLines.join('\n')}</code>
              </pre>
            </div>

            <ol className="grid gap-3">
              {setupSteps.map((step, index) => (
                <li key={step} className="rounded-2xl border border-border/80 bg-card/45 p-4 text-sm leading-6 text-muted-foreground">
                  <span className="mr-3 font-mono text-xs text-brand-accent">{String(index + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ol>
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
                  Give OpenClaw a stable public webhook edge.
                </h2>
                <p className="mt-5 text-base leading-7 text-muted-foreground">
                  Keep provider URLs stable, keep OpenClaw private, and let clawproxy handle the queue
                  between them.
                </p>
                <p className="mt-4 font-mono text-sm text-brand-accent">clawproxy.io/openclaw</p>
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
                  <Link href="/">Back to clawproxy</Link>
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
