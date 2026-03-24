'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { useSignOut } from '@/app/dashboard/use-sign-out';

export function SignOutButton() {
  const { signOut, busy, error } = useSignOut();

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
        onClick={() => void signOut()}
        disabled={busy}
        className="h-10 w-fit"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </Button>
    </div>
  );
}
