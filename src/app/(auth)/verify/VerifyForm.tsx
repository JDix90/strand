'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = searchParams.get('channel');
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (channel === 'email' && email) {
        const { error: err } = await authClient.emailOtp.verifyEmail({
          email: decodeURIComponent(email),
          otp: code.trim(),
        });
        if (err) {
          setError(err.message ?? 'Invalid code.');
          return;
        }
        router.push('/');
        return;
      }
      if (channel === 'phone' && phone) {
        const { error: err } = await authClient.phoneNumber.verify({
          phoneNumber: decodeURIComponent(phone),
          code: code.trim(),
          updatePhoneNumber: true,
        });
        if (err) {
          setError(err.message ?? 'Invalid code.');
          return;
        }
        router.push('/');
        return;
      }
      setError('Missing verification context. Start again from register.');
    } finally {
      setPending(false);
    }
  }

  if (channel !== 'email' && channel !== 'phone') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink-secondary">Invalid verification link.</p>
        <Link href="/register" className="text-link font-semibold">
          Back to register
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Enter verification code</h1>
        <p className="text-sm text-ink-secondary mt-1">
          We sent a 6-digit code to your {channel === 'email' ? 'email' : 'phone'}. In dev, check the terminal or{' '}
          <Link href="/dev/otp" className="text-link font-semibold">
            /dev/otp
          </Link>
          .
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-semibold text-ink mb-1">
            Code
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-xl border border-border px-3 py-2.5 bg-surface tracking-widest text-lg"
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            required
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand hover:bg-brand-hover text-white font-bold py-3 disabled:opacity-50"
        >
          {pending ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        <Link href="/login" className="text-link font-semibold">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
