'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      const auth = await createNeonClientAuth();
      const result = await auth.signOut();
      if (result?.error) {
        throw new Error(
          (result.error as { message?: string }).message || 'Sign out failed',
        );
      }
      router.push('/auth/sign-in');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      {error ? (
        <p className="text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onSignOut}
        disabled={busy}
        className="inline-flex w-fit items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
