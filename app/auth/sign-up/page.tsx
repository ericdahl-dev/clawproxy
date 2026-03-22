'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';
import { useRedirect127ToLocalhost } from '@/app/lib/auth/dev-origin';
import { AdminShell } from '@/components/app/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  useRedirect127ToLocalhost();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const result = await auth.signUp.email({
        email,
        password,
        name: name.trim() || email,
      });

      if (result?.error) {
        throw new Error(result.error.message || 'Sign-up failed');
      }

      setSuccess('Account created. You can now sign in.');
      setTimeout(() => {
        router.push('/auth/sign-in');
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminShell
      title="Create account"
      description="Create a Neon Auth account for managing nodes, routes, and events."
    >
      <form className="mt-2 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="sign-up-name">Name</Label>
          <Input
            id="sign-up-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10"
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
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
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10"
            placeholder="Choose a password"
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
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/auth/sign-in">Already have an account?</Link>
        </Button>
        <Button variant="link" className="text-brand-accent h-auto px-0" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </AdminShell>
  );
}
