function NodeBox({
  accent,
  label,
  sublabel,
  items,
  badge,
}: {
  accent?: boolean;
  label: string;
  sublabel: string;
  items: string[];
  badge?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col rounded-2xl border p-5 ${
        accent
          ? 'border-brand-accent/35 bg-card/50 ring-1 ring-brand-accent/15'
          : 'border-border bg-card/40'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-xs font-semibold tracking-[0.26em] uppercase ${accent ? 'text-brand-accent' : 'text-muted-foreground'}`}
          >
            {label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="border-border bg-card/60 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArrowRight({ topLabel, bottomLabel }: { topLabel: string; bottomLabel?: string }) {
  return (
    <div className="shrink-0 hidden md:flex flex-col items-center justify-center gap-1 px-1">
      <span className="text-muted-foreground text-[11px]">{topLabel}</span>
      <svg
        width="72"
        height={bottomLabel ? 32 : 16}
        viewBox={`0 0 72 ${bottomLabel ? 32 : 16}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 8 H62"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          className="text-border"
        />
        <path
          d="M58 4 L68 8 L58 12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-border"
        />
        {bottomLabel && (
          <>
            <path
              d="M68 24 H10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="5 3"
              className="text-border"
            />
            <path
              d="M14 20 L4 24 L14 28"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-border"
            />
          </>
        )}
      </svg>
      {bottomLabel && (
        <span className="text-muted-foreground text-[11px]">{bottomLabel}</span>
      )}
    </div>
  );
}

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 md:hidden">
      <svg
        width="16"
        height="36"
        viewBox="0 0 16 36"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 2 V28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          className="text-border"
        />
        <path
          d="M4 24 L8 34 L12 24"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-border"
        />
      </svg>
      <span className="text-muted-foreground text-[11px]">{label}</span>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <div
      className="border-border bg-card/20 rounded-[2rem] border p-6 backdrop-blur md:p-8"
      role="img"
      aria-label="Architecture diagram: webhook providers send events to clawproxy, which queues them for secure outbound delivery to a private OpenClaw node"
    >
      <div className="mb-6">
        <p className="text-brand-accent text-xs font-semibold tracking-[0.32em] uppercase">
          System overview
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Webhook events travel from the public internet to your private node — without exposing a single port.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 md:flex-row md:items-stretch md:gap-0">
        <NodeBox
          label="Provider"
          sublabel="Public internet"
          items={['GitHub', 'Stripe', 'Slack', 'Any webhook service']}
        />

        <ArrowRight topLabel="webhook POST" />
        <ArrowDown label="webhook POST" />

        <NodeBox
          accent
          label="clawproxy"
          sublabel="Public cloud"
          items={['Accepts & validates', 'Saves events until delivery', 'Manages delivery state']}
        />

        <ArrowRight topLabel="outbound pull" bottomLabel="events + ack" />
        <ArrowDown label="outbound pull / events" />

        <NodeBox
          label="OpenClaw node"
          sublabel="Your private network"
          items={['Polls for new events', 'Processes locally', 'Acknowledges delivery']}
          badge="🔒 Never exposed"
        />
      </div>

      <p className="text-muted-foreground mt-5 text-center text-xs">
        Your node always initiates the connection outbound — no open ports or firewall rules required.
      </p>
    </div>
  );
}
