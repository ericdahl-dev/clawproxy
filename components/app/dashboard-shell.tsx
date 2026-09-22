'use client';

import type { ReactNode } from 'react';

import { DashboardAppSidebar } from '@/components/app/dashboard-app-sidebar';
import { DashboardBreadcrumb } from '@/components/app/dashboard-breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

type DashboardShellProps = {
  userEmail: string;
  children: ReactNode;
};

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardAppSidebar userEmail={userEmail} />
      <SidebarInset className="relative min-h-svh overflow-hidden bg-brand-page">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `
              radial-gradient(circle at 78% 0%, color-mix(in oklab, var(--color-brand-accent) 16%, transparent), transparent 28%),
              radial-gradient(circle at 12% 18%, color-mix(in oklab, var(--color-brand-accent-muted) 55%, transparent), transparent 32%),
              linear-gradient(180deg, var(--color-brand-page), var(--color-background) 48%, var(--color-brand-page))
            `,
          }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />

        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-brand-page/70 px-4 backdrop-blur-xl md:px-6">
          <SidebarTrigger className="rounded-full border border-border/80 bg-background/30 text-muted-foreground hover:border-brand-accent/60 hover:text-foreground" />
          <Separator orientation="vertical" className="mr-1 bg-border/70 data-[orientation=vertical]:h-5" />
          <DashboardBreadcrumb />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
