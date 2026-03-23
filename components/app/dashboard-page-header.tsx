type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function DashboardPageHeader({ eyebrow, title, description }: Props) {
  return (
    <div>
      <p className="text-brand-accent text-sm font-semibold tracking-[0.32em] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">{description}</p>
    </div>
  );
}
