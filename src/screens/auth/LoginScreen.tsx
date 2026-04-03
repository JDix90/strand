import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SUPABASE_SETUP_MESSAGE } from '../../lib/supabase';

export function LoginScreen() {
  const navigate = useNavigate();
  const { signIn, supabaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: err } = await signIn(email, password);
    setSubmitting(false);

    if (err) {
      setError(err);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Strand</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
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
            <label className="text-slate-300 text-sm font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !supabaseConfigured}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white rounded-xl font-bold text-base transition-colors"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
