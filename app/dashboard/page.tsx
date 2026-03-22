import 'server-only';

import { redirect } from 'next/navigation';

import { SignOutButton } from '@/app/dashboard/sign-out-button';
import { auth } from '@/app/lib/auth/server';
import { AdminShell } from '@/components/app/admin-shell';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  if (!user) {
    const params = new URLSearchParams({ next: '/dashboard' });
    redirect(`/auth/sign-in?${params.toString()}`);
  }

  return (
    <AdminShell
      maxWidthClass="max-w-3xl"
      title="Dashboard"
      description={`Signed in as ${user.email ?? 'unknown user'}`}
    >
      <SignOutButton />
    </AdminShell>
  );
}
