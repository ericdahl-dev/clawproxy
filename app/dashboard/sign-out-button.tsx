'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
        throw new Error(result.error.message || 'Sign out failed');
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
    <div className="flex flex-col gap-2">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={onSignOut}
        disabled={busy}
        className="h-10 w-fit"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
