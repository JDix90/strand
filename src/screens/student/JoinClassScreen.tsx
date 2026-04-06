import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function JoinClassScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) { setError('Please enter a valid join code.'); return; }

    setSubmitting(true);

    const { data: cls, error: findError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', trimmed)
      .single();

    if (findError || !cls) {
      setSubmitting(false);
      setError('No class found with that code.');
      return;
    }

    const { data: existing } = await supabase
      .from('class_memberships')
      .select('id')
      .eq('class_id', cls.id)
      .eq('student_id', profile!.id)
      .single();

    if (existing) {
      setSubmitting(false);
      setError('You are already in this class.');
      return;
    }

    const { error: joinError } = await supabase.from('class_memberships').insert({
      class_id: cls.id,
      student_id: profile!.id,
    });

    setSubmitting(false);
    if (joinError) {
      setError(joinError.message);
    } else {
      setSuccess(`Joined "${cls.name}" successfully!`);
      setCode('');
      setTimeout(() => navigate('/home'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-ink">Join a Class</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <p className="text-ink-secondary text-sm">Enter the code your teacher gave you.</p>
        </div>

        <form onSubmit={handleJoin} className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          {error && (
            <div className="bg-red-950 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          {success && (
            <div className="bg-green-950 border border-green-700 text-green-300 text-sm rounded-xl px-4 py-3">{success}</div>
          )}

          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-1.5">Join Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-widest uppercase focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              placeholder="ABC123"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={submitting || code.trim().length < 4}
            className="w-full py-3 bg-brand hover:bg-brand-hover disabled:bg-slate-300 disabled:text-ink-secondary text-white rounded-xl font-bold text-base transition-colors"
          >
            {submitting ? 'Joining...' : 'Join Class'}
          </button>
        </form>
      </div>
    </div>
  );
}
