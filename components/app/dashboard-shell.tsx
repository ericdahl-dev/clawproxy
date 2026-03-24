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
      <SidebarInset className="bg-background min-h-svh">
        <header className="bg-background/80 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <DashboardBreadcrumb />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
