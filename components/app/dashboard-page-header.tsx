type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function DashboardPageHeader({ eyebrow, title, description }: Props) {
  return (
    <div className="rounded-[2rem] border border-border/80 bg-card/35 p-6 shadow-xl shadow-black/15 backdrop-blur md:p-7">
      <p className="font-mono text-xs font-semibold tracking-[0.18em] text-brand-accent uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
