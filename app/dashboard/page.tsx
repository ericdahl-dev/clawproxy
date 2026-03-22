import { redirect } from 'next/navigation';

import { auth } from '@/app/lib/auth/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data } = await auth.getSession();
  const user = data?.session?.user;

  if (!user) {
    redirect('/auth/sign-in?next=%2Fdashboard');
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          clawproxy admin
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Signed in as {user.email ?? 'unknown user'}
        </p>
      </div>
    </main>
  );
}
