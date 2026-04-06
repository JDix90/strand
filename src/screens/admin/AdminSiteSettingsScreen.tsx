import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const GENERAL_KEY = 'general';

export function AdminSiteSettingsScreen() {
  const navigate = useNavigate();
  const [rawJson, setRawJson] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', GENERAL_KEY).maybeSingle();
      if (cancelled) return;
      if (error) {
        setMessage({ type: 'err', text: error.message });
        setLoading(false);
        return;
      }
      setRawJson(JSON.stringify(data?.value ?? { announcement: '' }, null, 2));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      setMessage({ type: 'err', text: 'Invalid JSON.' });
      return;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setMessage({ type: 'err', text: 'Root value must be a JSON object.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key: GENERAL_KEY, value: parsed as Record<string, unknown>, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    setSaving(false);
    if (error) setMessage({ type: 'err', text: error.message });
    else setMessage({ type: 'ok', text: 'Saved.' });
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button type="button" onClick={() => navigate('/admin')} className="text-ink-secondary hover:text-ink">
            ← Admin
          </button>
          <h1 className="text-xl font-bold text-ink">Site settings</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <p className="text-ink-secondary text-sm leading-relaxed">
          Key <code className="text-amber-200/90 bg-surface px-1 rounded">{GENERAL_KEY}</code> holds a JSON object.
          You can extend this structure as needed (e.g. feature flags, announcement text).
        </p>

        {loading ? (
          <p className="text-ink-secondary">Loading…</p>
        ) : (
          <>
            <textarea
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[280px] font-mono text-sm px-4 py-3 rounded-xl bg-surface-elevated border border-border-strong text-ink focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === 'ok'
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-200'
                    : 'bg-red-950 border border-red-800 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-ink rounded-xl font-semibold transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
