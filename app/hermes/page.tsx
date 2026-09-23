import Link from "next/link";

import { Button } from "@/components/ui/button";

const steps = ["Provider webhook", "clawproxy route", "Hermes agent run"];
const snippet = `# 1. Create a clawproxy route in the dashboard
# Provider URL: https://clawproxy.io/api/ingress/<userId>/<routeSlug>

# 2. Install the Hermes gateway plugin
hermes plugins install ericdahl-dev/clawproxy-hermes

# 3. Add these to ~/.hermes/.env (or your profile's .env)
CLAWPROXY_NODE_TOKEN=cpn_your_node_token
CLAWPROXY_HERMES_WEBHOOK_SECRET=<platforms.webhook.extra.secret>

# 4. Restart the gateway, then check delivery
hermes gateway status`;

export const dynamic = "force-dynamic";

export default function HermesLandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-brand-page text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
      <section className="mx-auto flex w-full max-w-7xl flex-col px-5 pb-20 pt-6 sm:px-8 lg:px-10">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-mono text-[0.78rem] font-semibold tracking-[0.28em] text-brand-accent uppercase">clawproxy</span>
            <span className="hidden text-sm text-muted-foreground md:inline">Webhook relay for Hermes agent workflows</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary navigation">
            <a href="https://github.com/ericdahl-dev/clawproxy-hermes" className="hidden rounded-full border border-border/80 px-4 py-2 text-sm text-foreground/85 transition hover:border-brand-accent/60 hover:text-foreground sm:inline-flex">Hermes plugin</a>
            <Button asChild size="lg" className="rounded-full px-5 font-semibold"><Link href="/dashboard">Create a route</Link></Button>
          </nav>
        </header>
        <section className="grid min-h-[calc(100dvh-5rem)] items-center gap-8 py-9 lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
          <div className="max-w-4xl">
            <p className="max-w-xl font-mono text-xs font-semibold tracking-[0.18em] text-brand-accent uppercase">Webhook relay for Hermes agent workflows</p>
            <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">Route webhooks into private Hermes runs.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">Route GitHub, Stripe, Slack, or custom webhooks into Hermes without opening inbound ports. clawproxy accepts the public request, stores it, and delivers it to Hermes when your node is configured with an outbound connection.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Button asChild size="lg" className="rounded-full px-6 py-3 text-sm font-semibold"><Link href="/dashboard">Create a route</Link></Button><Button asChild variant="outline" size="lg" className="rounded-full border-border/90 bg-background/30 px-6 py-3 text-sm font-semibold backdrop-blur"><a href="#setup">Copy setup snippet</a></Button></div>
          </div>
          <div className="relative w-full max-w-[34rem] lg:justify-self-end"><div className="absolute -inset-8 rounded-[3rem] bg-brand-accent/10 blur-3xl" /><div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"><div className="rounded-[1.5rem] border border-brand-accent/25 bg-brand-accent/10 p-4"><p className="font-mono text-xs text-brand-accent">delivery target</p><h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.04em]">Hermes stays private. Work still starts instantly.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Public webhooks become reliable inputs for agent workflows, Kanban dispatch, and automation runs.</p></div><div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70">{steps.map((step, index) => (<div key={step} className="bg-background/45 p-3"><p className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</p><p className="mt-3 text-sm font-semibold leading-5">{step}</p></div>))}</div></div></div>
        </section>
        <section className="grid gap-px overflow-hidden rounded-[2rem] border border-border/80 bg-border/80 md:grid-cols-3">{["Trigger Kanban workers from GitHub", "Keep agent boxes private", "Debug webhook delivery"].map((title, index) => (<article key={title} className="bg-card/60 p-7 backdrop-blur"><p className="font-mono text-xs text-brand-accent">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{title}</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Use clawproxy as the durable public front door for Hermes automation that should stay behind outbound-only network boundaries.</p></article>))}</section>
        <section id="setup" className="grid gap-10 border-b border-border/70 py-20 lg:grid-cols-[0.78fr_1.22fr] lg:py-28"><div><h2 className="max-w-lg text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Connect Hermes with one public route.</h2><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Create a clawproxy route, copy its generated provider URL and node token from the dashboard, then install the Hermes plugin. A clawproxy route named <code className="rounded-md border border-border/70 bg-background/45 px-1.5 py-0.5 font-mono text-sm text-foreground">github-prs</code> delivers to the Hermes webhook route with the same slug.</p></div><div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/60 backdrop-blur"><div className="border-b border-border/70 px-5 py-4"><p className="font-mono text-xs text-brand-accent">setup snippet</p></div><pre className="overflow-x-auto p-5 text-sm leading-7 text-muted-foreground"><code>{snippet}</code></pre></div></section>
      </section>
    </main>
  );
}
