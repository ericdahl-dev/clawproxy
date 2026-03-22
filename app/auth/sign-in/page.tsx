'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';
import { useRedirect127ToLocalhost } from '@/app/lib/auth/dev-origin';
import { resolvePostSignInRedirect } from '@/app/lib/auth/post-sign-in-redirect';

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

      const redirectPath = resolvePostSignInRedirect(searchParams.get('next'));
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          clawproxy admin
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Sign in with your Neon Auth account to manage nodes, routes, and events.
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d1728] px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-white/75">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0d1728] px-4 py-3 text-white outline-none ring-0 placeholder:text-white/35"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-white/55">
          Need an account? Create one through your Neon Auth configuration flow first.
        </p>

        <div className="mt-6 flex items-center justify-between text-sm text-cyan-200">
          <Link href="/auth/forgot-password">Forgot password?</Link>
          <Link href="/auth/sign-up">Create account</Link>
        </div>

        <div className="mt-4 text-sm text-cyan-200">
          <Link href="/">Back to home</Link>
        </div>
      </div>
    </main>
  );
}
