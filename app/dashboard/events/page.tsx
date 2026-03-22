export const dynamic = 'force-dynamic';

export default function DashboardEventsPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">Events</p>
        <h2 className="mt-3 text-3xl font-semibold">Delivery events</h2>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          Inspect queued webhook deliveries, acknowledgements, and failures.
        </p>
      </div>

      <div className="border-border/70 bg-background/40 rounded-2xl border p-5">
        <p className="text-sm text-muted-foreground">No delivery events are available yet.</p>
      </div>
    </section>
  );
}
