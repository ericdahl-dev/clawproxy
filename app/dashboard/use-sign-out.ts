'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';

export function useSignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const auth = await createNeonClientAuth();
      const result = await auth.signOut();

      if (result?.error) {
        throw new Error(result.error.message || 'Sign out failed');
      }

      router.push('/auth/sign-in');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setBusy(false);
    }
  }, [router]);

  return { signOut, busy, error };
}
