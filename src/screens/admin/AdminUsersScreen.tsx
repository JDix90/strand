import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface ProfileRow {
  id: string;
  role: string;
  display_name: string;
  email: string | null;
  created_at: string;
  last_active_at: string | null;
}

export function AdminUsersScreen() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: qErr } = await supabase
        .from('profiles')
        .select('id, role, display_name, email, created_at, last_active_at')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (qErr) setError(qErr.message);
      setRows((data ?? []) as ProfileRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button type="button" onClick={() => navigate('/admin')} className="text-ink-secondary hover:text-ink">
            ← Admin
          </button>
          <h1 className="text-xl font-bold text-ink">Users</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950 px-4 py-3 text-red-300 text-sm">{error}</div>
        )}
        {loading ? (
          <p className="text-ink-secondary">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-elevated text-left text-ink-secondary">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">User ID</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t border-border bg-surface-elevated/40">
                    <td className="px-4 py-3 text-ink font-medium">{r.display_name}</td>
                    <td className="px-4 py-3 text-ink-secondary">{r.email ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-ink-secondary">{r.role}</td>
                    <td className="px-4 py-3 text-ink-secondary font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">
                      {r.last_active_at ? new Date(r.last_active_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
