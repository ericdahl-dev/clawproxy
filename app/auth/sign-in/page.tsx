'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import posthog from 'posthog-js';

import { createNeonClientAuth } from '@/app/lib/auth/client';
import { useRedirect127ToLocalhost } from '@/app/lib/auth/dev-origin';
import { resolvePostSignInRedirect } from '@/app/lib/auth/post-sign-in-redirect';
import { AdminShell } from '@/components/app/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  useRedirect127ToLocalhost();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const auth = await createNeonClientAuth();
      const result = await auth.signIn.email({
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error.message || 'Sign-in failed');
      }

      posthog.identify(email, { email });
      posthog.capture('user_signed_in', { email });

      const redirectPath = resolvePostSignInRedirect(searchParams.get('next'));
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      posthog.captureException(err);
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell
      title="Sign in"
      description="Sign in with your Neon Auth account to manage nodes, routes, and events."
    >
      <form className="mt-2 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="sign-in-email">Email</Label>
          <Input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sign-in-password">Password</Label>
          <Input
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={submitting} className="h-10 w-full" size="lg">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-sm">
        Need an account? Create one through your Neon Auth configuration flow first.
      </p>

      <div className="mt-6 flex items-center justify-between gap-2 text-sm">
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/auth/forgot-password">Forgot password?</Link>
        </Button>
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/auth/sign-up">Create account</Link>
        </Button>
      </div>

      <div className="mt-4 text-sm">
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </AdminShell>
  );
}
