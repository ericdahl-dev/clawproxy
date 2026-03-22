import 'server-only';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { SignOutButton } from '@/app/dashboard/sign-out-button';
import { auth } from '@/app/lib/auth/server';

const navigation = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/nodes', label: 'Nodes' },
  { href: '/dashboard/routes', label: 'Routes' },
  { href: '/dashboard/events', label: 'Events' },
];

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
            <p className="text-muted-foreground mt-1 text-sm">
              Signed in as {user.email ?? 'unknown user'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav aria-label="Dashboard navigation">
              <ul className="flex flex-wrap gap-2">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="border-border/80 text-foreground/85 hover:bg-muted/60 rounded-full border px-4 py-2 text-sm transition"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <SignOutButton />
          </div>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="border-border/70 bg-card/70 rounded-[1.75rem] border p-6 shadow-lg shadow-black/15 backdrop-blur">
            {children}
          </div>

          <aside className="border-border/70 bg-card/60 rounded-[1.75rem] border p-6 shadow-lg shadow-black/15 backdrop-blur">
            <p className="text-brand-accent text-xs font-semibold tracking-[0.28em] uppercase">
              Quick links
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-medium">Nodes</p>
                <p className="text-muted-foreground">Manage node registration and connection health.</p>
              </div>
              <div>
                <p className="font-medium">Routes</p>
                <p className="text-muted-foreground">Create and inspect webhook ingress routes.</p>
              </div>
              <div>
                <p className="font-medium">Events</p>
                <p className="text-muted-foreground">Review delivery history and failures.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
