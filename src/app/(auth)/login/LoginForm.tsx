'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { isE164Phone, phoneToPseudoEmail } from '@/lib/phone';

type Channel = 'email' | 'phone';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';

  const [channel, setChannel] = useState<Channel>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (channel === 'email') {
        const email = identifier.trim().toLowerCase();
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) {
          setError(err.message ?? 'Invalid email or password.');
          return;
        }
        router.push(nextPath.startsWith('/') ? nextPath : '/');
        return;
      }

      const phone = identifier.trim();
      if (!isE164Phone(phone)) {
        setError('Use international format, e.g. +15551234567');
        return;
      }
      const pseudoEmail = phoneToPseudoEmail(phone);
      const { error: err } = await authClient.signIn.email({ email: pseudoEmail, password });
      if (err) {
        setError(err.message ?? 'Invalid phone or password.');
        return;
      }
      router.push(nextPath.startsWith('/') ? nextPath : '/');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Sign in</h1>
        <p className="text-sm text-ink-secondary mt-1">Use the same email or phone you registered with.</p>
      </div>

      <div className="flex rounded-xl border border-border p-1 bg-surface-elevated">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${channel === 'email' ? 'bg-brand text-white' : 'text-ink-secondary'}`}
          onClick={() => setChannel('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${channel === 'phone' ? 'bg-brand text-white' : 'text-ink-secondary'}`}
          onClick={() => setChannel('phone')}
        >
          Phone
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="id" className="block text-sm font-semibold text-ink mb-1">
            {channel === 'email' ? 'Email' : 'Phone (E.164)'}
          </label>
          <input
            id="id"
            autoComplete={channel === 'email' ? 'email' : 'tel'}
            className="w-full rounded-xl border border-border px-3 py-2.5 bg-surface"
            placeholder={channel === 'email' ? 'you@example.com' : '+15551234567'}
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="pw" className="block text-sm font-semibold text-ink mb-1">
            Password
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border px-3 py-2.5 bg-surface"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand hover:bg-brand-hover text-white font-bold py-3 disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        New here?{' '}
        <Link href="/register" className="text-link font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
