'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';
import { useRedirect127ToLocalhost } from '@/app/lib/auth/dev-origin';
import { AdminShell } from '@/components/app/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  useRedirect127ToLocalhost();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const auth = await createNeonClientAuth();
      const result = await auth.requestPasswordReset({
        email,
        redirectTo: '/auth/sign-in',
      });

      if (result?.error) {
        throw new Error(result.error.message || 'Password reset failed');
      }

      setSuccess('If that account exists, a reset email has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell
      title="Reset password"
      description="Enter your email address and Neon Auth will send password recovery instructions."
    >
      <form className="mt-2 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
            placeholder="you@example.com"
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? (
          <Alert className="border-emerald-400/30 bg-emerald-400/10 text-emerald-50">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={submitting} className="h-10 w-full" size="lg">
          {submitting ? 'Sending reset…' : 'Send reset email'}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/auth/sign-in">Back to sign in</Link>
        </Button>
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/auth/sign-up">Create account</Link>
        </Button>
      </div>
    </AdminShell>
  );
}
