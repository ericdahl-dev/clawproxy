export const dynamic = 'force-dynamic';

export default function DashboardNodesPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">Nodes</p>
        <h2 className="mt-3 text-3xl font-semibold">Connected nodes</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          Register and monitor private OpenClaw nodes that pull events from the queue.
        </p>
      </div>

      <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
        <p className="text-sm text-muted-foreground">No nodes have been registered yet.</p>
      </div>
    </section>
  );
}
