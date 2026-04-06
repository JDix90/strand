import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SUPABASE_SETUP_MESSAGE } from '../../lib/supabase';
import type { SignUpRole } from '../../types';
import { BrandLogo } from '../../components/brand/BrandLogo';

export function SignUpScreen() {
  const navigate = useNavigate();
  const { signUp, supabaseConfigured, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<SignUpRole>('student');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      navigate('/', { replace: true });
    }
  }, [loading, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const { error: err, emailConfirmationSent } = await signUp(email, password, displayName, role);
    setSubmitting(false);

    if (err) {
      setError(err);
    } else if (emailConfirmationSent) {
      setInfo('Check your email to confirm your account, then sign in here.');
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
          <p className="text-ink-secondary text-sm mt-1">Create your account</p>
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
          {info && (
            <div className="bg-emerald-950 border border-emerald-700 text-emerald-200 text-sm rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <div>
            <label className="text-ink text-sm font-semibold block mb-1.5">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'student' as SignUpRole, label: 'Student', icon: '🎓', desc: 'Learn and practice' },
                { value: 'teacher' as SignUpRole, label: 'Teacher', icon: '👨‍🏫', desc: 'Manage classes' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    role === opt.value
                      ? 'border-brand bg-brand/15 text-ink'
                      : 'border-border-strong bg-surface-muted text-ink-secondary hover:border-border-strong'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-xs text-ink-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-ink text-sm font-semibold block mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-ink text-sm font-semibold block mb-1.5">Email</label>
            <input
              type="email"
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
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !supabaseConfigured}
            className="w-full py-3 bg-brand hover:bg-brand-hover disabled:bg-slate-300 disabled:text-ink-secondary text-white rounded-xl font-bold text-base transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-ink-secondary text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-link hover:text-link font-semibold">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
