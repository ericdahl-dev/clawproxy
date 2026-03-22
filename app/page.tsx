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
    title: 'Pull-based by design',
    description:
      'Your OpenClaw node authenticates, fetches queued events, processes them locally, and acknowledges success on its own schedule.',
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
    title: 'Deliver over outbound pull',
    description:
      'Your OpenClaw node polls securely, processes events locally, and acknowledges delivery when complete.',
  },
];

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_34%),linear-gradient(180deg,_#07111f_0%,_#0a1528_52%,_#07111f_100%)]" />
      <div className="absolute left-1/2 top-24 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-24 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200/85">
              clawproxy
            </p>
            <p className="mt-1 text-sm text-white/55">
              Public webhook ingress for private OpenClaw nodes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/openclaw/openclaw"
              className="hidden rounded-full border border-white/12 px-4 py-2 text-sm text-white/80 transition hover:bg-white/8 sm:inline-flex"
            >
              OpenClaw
            </a>
            <a
              href="/dashboard"
              className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-cyan-400/30 transition hover:bg-cyan-200"
            >
              Dashboard
            </a>
          </div>
        </header>

        <section className="grid items-center gap-16 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur">
              Stop exposing ports just to receive webhooks
            </div>

            <h1 className="mt-8 text-5xl font-semibold leading-[1.02] text-balance sm:text-6xl lg:text-7xl">
              Webhooks for private nodes.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
              Accept webhook traffic from the public internet, store it durably,
              and deliver it to your OpenClaw node over authenticated outbound
              pull. No public node exposure required.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/dashboard"
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Get started
              </a>
              <a
                href="#how-it-works"
                className="rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {proofPoints.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-300/20 via-transparent to-indigo-400/18 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
              <div className="rounded-[1.6rem] border border-white/10 bg-[#08101d]/90 p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
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
                      title: 'Node pull',
                      body: 'Your private OpenClaw node fetches pending events securely.',
                    },
                    {
                      title: 'Ack complete',
                      body: 'Processed events are acknowledged and marked delivered.',
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="flex gap-4 rounded-2xl border border-white/8 bg-white/5 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-300 font-semibold text-slate-950">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-white/65">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Mode</p>
                    <p className="mt-2 text-lg font-semibold">Pull-based</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Storage</p>
                    <p className="mt-2 text-lg font-semibold">Durable queue</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">Ideal for</p>
                    <p className="mt-2 text-lg font-semibold">NAT + LAN</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-white/10 py-14 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/68">{feature.description}</p>
            </article>
          ))}
        </section>

        <section
          id="how-it-works"
          className="grid gap-10 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-16"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Keep the webhook path public and the node private.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
              clawproxy is deliberately focused: it receives inbound webhook
              traffic on the public internet and hands it off to private
              OpenClaw nodes through authenticated outbound requests.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-sm font-semibold text-cyan-100">
                  0{index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/68">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="rounded-[2rem] border border-cyan-300/18 bg-gradient-to-r from-cyan-300/10 via-white/6 to-indigo-300/10 p-8 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              Ready to route inbound events?
            </p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold sm:text-4xl">
                  Public ingress on one side. Secure outbound delivery on the other.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/70">
                  Built for the very common reality that your software can call out,
                  but should not be exposed directly to the internet.
                </p>
                <p className="mt-3 text-sm text-white/50">clawproxy.io</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/dashboard"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                >
                  Open dashboard
                </a>
                <a
                  href="https://github.com/openclaw/openclaw"
                  className="rounded-full border border-white/12 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Learn about OpenClaw
                </a>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
