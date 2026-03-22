export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
          Overview
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Welcome back</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          Use the dashboard navigation to manage nodes, routes, and events for your public ingress
          and private delivery pipeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Nodes',
            description: 'Register OpenClaw nodes and monitor their connection status.',
          },
          {
            title: 'Routes',
            description: 'Define public webhook endpoints and inspect ingress settings.',
          },
          {
            title: 'Events',
            description: 'Review queued events, delivery attempts, and failures.',
          },
        ].map((item) => (
          <article key={item.title} className="border-border/70 bg-background/40 rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
