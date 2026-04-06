import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { CaseId } from '../../types';

const CASE_ORDER: CaseId[] = ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'];
const CASE_LABELS: Record<CaseId, string> = {
  nominative: 'Nom', genitive: 'Gen', dative: 'Dat',
  accusative: 'Acc', instrumental: 'Inst', prepositional: 'Prep',
};
const STATUS_COLORS: Record<string, string> = {
  unseen: 'bg-surface-muted text-ink-secondary',
  introduced: 'bg-yellow-950 text-yellow-400',
  shaky: 'bg-orange-950 text-orange-400',
  improving: 'bg-brand/15 text-link',
  strong: 'bg-green-950 text-green-400',
  mastered: 'bg-emerald-950 text-emerald-300',
};

interface MasteryRow {
  form_key: string;
  attempts: number;
  correct: number;
  status: string;
  mastery_score: number;
  confusion_with: string[];
  last_seen_at: string;
}

interface SessionRow {
  id: string;
  mode_id: string;
  score: number;
  accuracy: number;
  total_questions: number;
  completed_at: string;
}

export function StudentDetailScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [masteryRows, setMasteryRows] = useState<MasteryRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', studentId)
        .single();
      setStudentName(prof?.display_name ?? 'Unknown');

      const { data: mastery } = await supabase
        .from('mastery_records')
        .select('form_key, attempts, correct, status, mastery_score, confusion_with, last_seen_at')
        .eq('user_id', studentId)
        .order('mastery_score', { ascending: true });
      setMasteryRows(mastery ?? []);

      const { data: sess } = await supabase
        .from('session_summaries')
        .select('id, mode_id, score, accuracy, total_questions, completed_at')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(20);
      setSessions(sess ?? []);

      setLoading(false);
    };

    load();
  }, [studentId]);

  const caseGroups: Record<CaseId, MasteryRow[]> = {
    nominative: [], genitive: [], dative: [], accusative: [], instrumental: [], prepositional: [],
  };
  for (const row of masteryRows) {
    const parts = row.form_key.split('_');
    const caseId = parts[parts.length - 1] as CaseId;
    if (caseGroups[caseId]) caseGroups[caseId].push(row);
  }

  const weakForms = masteryRows
    .filter(r => r.status === 'shaky' || r.status === 'introduced')
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 8);

  const confusions: string[] = [];
  for (const row of masteryRows) {
    for (const c of row.confusion_with) {
      const pair = [row.form_key, c].sort().join(' ↔ ');
      if (!confusions.includes(pair)) confusions.push(pair);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-ink-secondary hover:text-ink text-sm mb-2 block">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-ink">{studentName}</h1>
          <p className="text-ink-secondary text-sm mt-0.5">
            {masteryRows.length} forms tracked · {sessions.length} sessions
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Case Breakdown */}
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            Mastery by Case
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CASE_ORDER.map(c => {
              const rows = caseGroups[c];
              const total = rows.length;
              const mastered = rows.filter(r => r.status === 'mastered' || r.status === 'strong').length;
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
              return (
                <div key={c} className="bg-surface border border-border rounded-xl p-4">
                  <p className="text-ink font-bold capitalize">{CASE_LABELS[c]}</p>
                  <p className="text-2xl font-bold text-link mt-1">{pct}%</p>
                  <p className="text-ink-secondary text-xs">{mastered}/{total} strong+</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weak Forms */}
        {weakForms.length > 0 && (
          <div>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
              Weakest Forms
            </h2>
            <div className="flex flex-wrap gap-2">
              {weakForms.map(f => (
                <span
                  key={f.form_key}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${STATUS_COLORS[f.status] ?? STATUS_COLORS.unseen}`}
                >
                  {f.form_key.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confusion Pairs */}
        {confusions.length > 0 && (
          <div>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
              Confusion Pairs
            </h2>
            <div className="flex flex-wrap gap-2">
              {confusions.slice(0, 10).map(pair => (
                <span key={pair} className="bg-red-950 text-red-300 px-3 py-1.5 rounded-lg text-xs font-mono">
                  {pair}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            Recent Sessions
          </h2>
          {sessions.length === 0 ? (
            <p className="text-ink-secondary text-sm">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3"
                >
                  <div>
                    <p className="text-ink text-sm font-medium capitalize">{s.mode_id.replace(/_/g, ' ')}</p>
                    <p className="text-ink-secondary text-xs">{new Date(s.completed_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-ink font-bold">{s.score}</p>
                    <p className="text-ink-secondary text-xs">
                      {Math.round(s.accuracy * 100)}% · {s.total_questions}q
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
