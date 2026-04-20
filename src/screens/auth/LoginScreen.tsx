import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SUPABASE_SETUP_MESSAGE } from '../../lib/supabase';
import { BrandLogo } from '../../components/brand/BrandLogo';

export function LoginScreen() {
  const navigate = useNavigate();
  const { signIn, supabaseConfigured, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      navigate('/', { replace: true });
    }
  }, [loading, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: err } = await signIn(email, password);
    setSubmitting(false);

    if (err) {
      setError(err);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="lg" />
          </div>
          <p className="text-ink-secondary text-sm mt-1">Sign in to continue</p>
          <Link to="/" className="text-ink-secondary text-sm hover:text-ink inline-block">
            ← Back to home
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          {!supabaseConfigured && (
            <div className="bg-amber-950 border border-amber-700 text-amber-100 text-sm rounded-xl px-4 py-3 space-y-2">
              <p className="font-semibold text-amber-200">Supabase is not configured</p>
              <p className="text-amber-100/90 leading-relaxed">{SUPABASE_SETUP_MESSAGE}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-950 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="text-ink text-sm font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              data-testid="login-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-ink text-sm font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              data-testid="login-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            data-testid="login-submit"
            disabled={submitting || !supabaseConfigured}
            className="w-full py-3 bg-brand hover:bg-brand-hover disabled:bg-slate-300 disabled:text-ink-secondary text-white rounded-xl font-bold text-base transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-ink-secondary text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-link hover:text-link font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
