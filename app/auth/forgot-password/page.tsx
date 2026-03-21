'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { createNeonClientAuth } from '@/app/lib/auth/client';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
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
    <main className="min-h-screen bg-[#07111f] px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          clawproxy admin
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Reset password</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Enter your email address and Neon Auth will send password recovery instructions.
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
              className="w-full rounded-xl border border-white/10 bg-[#0d1728] px-4 py-3 text-white outline-none placeholder:text-white/35"
              placeholder="you@example.com"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending reset…' : 'Send reset email'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-cyan-200">
          <Link href="/auth/sign-in">Back to sign in</Link>
          <Link href="/auth/sign-up">Create account</Link>
        </div>
      </div>
    </main>
  );
}
