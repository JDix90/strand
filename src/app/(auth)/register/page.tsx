'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { isE164Phone, phoneToPseudoEmail } from '@/lib/phone';

type Channel = 'email' | 'phone';

export default function RegisterPage() {
  const router = useRouter();
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
        if (!email.includes('@')) {
          setError('Enter a valid email address.');
          setPending(false);
          return;
        }
        const { error: signErr } = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0] ?? 'Learner',
        });
        if (signErr) {
          setError(signErr.message ?? 'Could not create account.');
          setPending(false);
          return;
        }
        const { error: otpErr } = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: 'email-verification',
        });
        if (otpErr) {
          setError(otpErr.message ?? 'Could not send verification code.');
          setPending(false);
          return;
        }
        router.push(`/verify?channel=email&email=${encodeURIComponent(email)}`);
        return;
      }

      const phone = identifier.trim();
      if (!isE164Phone(phone)) {
        setError('Use international format, e.g. +15551234567');
        setPending(false);
        return;
      }
      const pseudoEmail = phoneToPseudoEmail(phone);
      const { error: signErr } = await authClient.signUp.email({
        email: pseudoEmail,
        password,
        name: phone,
      });
      if (signErr) {
        setError(signErr.message ?? 'Could not create account.');
        setPending(false);
        return;
      }
      const { error: inErr } = await authClient.signIn.email({
        email: pseudoEmail,
        password,
      });
      if (inErr) {
        setError(inErr.message ?? 'Could not start session for phone verification.');
        setPending(false);
        return;
      }
      const { error: otpErr } = await authClient.phoneNumber.sendOtp({
        phoneNumber: phone,
      });
      if (otpErr) {
        setError(otpErr.message ?? 'Could not send SMS code.');
        setPending(false);
        return;
      }
      router.push(`/verify?channel=phone&phone=${encodeURIComponent(phone)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Create account</h1>
        <p className="text-sm text-ink-secondary mt-1">Register with email or phone, then verify with a code.</p>
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
            autoComplete="new-password"
            className="w-full rounded-xl border border-border px-3 py-2.5 bg-surface"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand hover:bg-brand-hover text-white font-bold py-3 disabled:opacity-50"
        >
          {pending ? 'Working…' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-secondary">
        Already have an account?{' '}
        <Link href="/login" className="text-link font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
