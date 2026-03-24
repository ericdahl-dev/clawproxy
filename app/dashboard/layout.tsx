import 'server-only';

import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DashboardNav } from '@/app/dashboard/dashboard-nav';
import { SignOutButton } from '@/app/dashboard/sign-out-button';
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
    <main className="min-h-screen bg-brand-page text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-border/70 bg-card/80 flex flex-col gap-4 rounded-[1.75rem] border px-5 py-4 shadow-xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-brand-accent text-xs font-semibold tracking-[0.32em] uppercase">
              clawproxy dashboard
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span>Signed in as {user.email ?? 'unknown user'}</span>
              <span className="border-brand-accent/40 text-brand-accent rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase">
                Admin
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DashboardNav />
            <SignOutButton />
          </div>
        </header>

        <section className="flex-1">
          <div className="border-border/70 bg-card/70 rounded-[1.75rem] border p-6 shadow-lg shadow-black/15 backdrop-blur">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
