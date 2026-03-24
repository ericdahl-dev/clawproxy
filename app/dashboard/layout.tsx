import 'server-only';

import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/app/dashboard-shell';
import { auth } from '@/app/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    const params = new URLSearchParams({ next: '/dashboard' });
    redirect(`/auth/sign-in?${params.toString()}`);
  }

  return (
    <DashboardShell userEmail={user.email ?? 'unknown user'}>{children}</DashboardShell>
  );
}
