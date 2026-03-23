import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/app/lib/utils';

type AdminShellProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  maxWidthClass?: string;
  children: ReactNode;
  cardClassName?: string;
};

export function AdminShell({
  eyebrow = 'clawproxy admin',
  title,
  description,
  maxWidthClass = 'max-w-md',
  children,
  cardClassName,
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-brand-page px-6 py-16 text-foreground">
      <div className={cn('mx-auto w-full', maxWidthClass)}>
        <Card
          className={cn(
            'border-border/80 bg-card/90 py-6 shadow-xl shadow-black/25 backdrop-blur-md',
            cardClassName,
          )}
        >
          <CardHeader className="border-border/60 border-b pb-4">
            <p className="text-sm font-semibold tracking-[0.28em] text-brand-accent uppercase">
              {eyebrow}
            </p>
            <CardTitle className="font-heading text-3xl font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-base leading-6 text-pretty">
                {description}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="pt-2">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
