import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { fetchAllCatalogUnits, type UnitRow } from '../../lib/curriculumApi';
import type { CaseId } from '../../types';

const CASE_ORDER: CaseId[] = ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'];
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  unseen: { label: 'Unseen', color: 'bg-slate-600' },
  introduced: { label: 'Intro', color: 'bg-yellow-600' },
  shaky: { label: 'Shaky', color: 'bg-orange-600' },
  improving: { label: 'Improving', color: 'bg-blue-600' },
  strong: { label: 'Strong', color: 'bg-green-600' },
  mastered: { label: 'Mastered', color: 'bg-emerald-500' },
};

interface MasteryRow {
  user_id: string;
  form_key: string;
  unit_id: string | null;
  status: string;
  attempts: number;
  correct: number;
  confusion_with: string[];
}

export function AnalyticsScreen() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [className, setClassName] = useState('');
  const [masteryRows, setMasteryRows] = useState<MasteryRow[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>('all');

  useEffect(() => {
    fetchAllCatalogUnits().then(setUnits);
  }, []);

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      const { data: cls } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
      setClassName(cls?.name ?? '');

      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('student_id')
        .eq('class_id', classId);
      const studentIds = (memberships ?? []).map(m => m.student_id);
      setStudentCount(studentIds.length);

      if (studentIds.length > 0) {
        const { data: mastery } = await supabase
          .from('mastery_records')
          .select('user_id, form_key, unit_id, status, attempts, correct, confusion_with')
          .in('user_id', studentIds);
        setMasteryRows(mastery ?? []);
      }

      setLoading(false);
    };

    load();
  }, [classId]);

  const filteredRows =
    unitFilter === 'all' ? masteryRows : masteryRows.filter(r => r.unit_id === unitFilter);

  // Aggregate: weakest cases
  const caseStats: Record<CaseId, { total: number; correct: number; statusCounts: Record<string, number> }> = {} as never;
  for (const c of CASE_ORDER) {
    caseStats[c] = { total: 0, correct: 0, statusCounts: {} };
  }
  for (const row of filteredRows) {
    const parts = row.form_key.split(':');
    const caseId = (parts[1] ?? '') as CaseId;
    if (!caseStats[caseId]) continue;
    caseStats[caseId].total += row.attempts;
    caseStats[caseId].correct += row.correct;
    const st = row.status;
    caseStats[caseId].statusCounts[st] = (caseStats[caseId].statusCounts[st] ?? 0) + 1;
  }

  // Top confusion pairs
  const confusionMap: Record<string, number> = {};
  for (const row of filteredRows) {
    for (const c of row.confusion_with) {
      const pair = [row.form_key, c].sort().join(' ↔ ');
      confusionMap[pair] = (confusionMap[pair] ?? 0) + 1;
    }
  }
  const topConfusions = Object.entries(confusionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm mb-2 block">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Class Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">{className} · {studentCount} students</p>
          <div className="mt-4 flex items-center gap-2">
            <label htmlFor="unit-filter" className="text-slate-400 text-sm">
              Unit
            </label>
            <select
              id="unit-filter"
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All units</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>
          <p className="text-slate-500 text-xs mt-2 max-w-xl">
            Some older records have no unit_id; they are included when you choose &quot;All units&quot; but not when you
            filter to a single catalog unit.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {studentCount === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No students to analyze yet.</p>
          </div>
        ) : (
          <>
            {/* Case Accuracy Bars */}
            <div>
              <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
                Accuracy by Case
              </h2>
              <div className="space-y-3">
                {CASE_ORDER.map(c => {
                  const s = caseStats[c];
                  const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={c} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold capitalize">{c}</span>
                        <span className="text-slate-300 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mastery Heatmap */}
            <div>
              <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
                Mastery Distribution
              </h2>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="grid grid-cols-6 gap-3">
                  {CASE_ORDER.map(c => {
                    const counts = caseStats[c].statusCounts;
                    const totalForms = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <div key={c} className="text-center">
                        <p className="text-slate-400 text-xs font-semibold mb-2 capitalize">{c.slice(0, 3)}</p>
                        <div className="space-y-1">
                          {Object.entries(STATUS_DISPLAY).map(([key, info]) => {
                            const count = counts[key] ?? 0;
                            const heightPct = Math.max(4, (count / totalForms) * 100);
                            return (
                              <div key={key} className="relative group">
                                <div
                                  className={`${info.color} rounded-sm mx-auto transition-all`}
                                  style={{ height: `${Math.round(heightPct * 0.4)}px`, minHeight: '3px', width: '100%', opacity: count > 0 ? 1 : 0.15 }}
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-700 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap z-10">
                                  {info.label}: {count}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {Object.entries(STATUS_DISPLAY).map(([key, info]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${info.color}`} />
                      <span className="text-slate-500 text-xs">{info.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Confusion Pairs */}
            {topConfusions.length > 0 && (
              <div>
                <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
                  Most Common Confusions
                </h2>
                <div className="space-y-2">
                  {topConfusions.map(([pair, count]) => (
                    <div
                      key={pair}
                      className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-3"
                    >
                      <span className="text-red-300 font-mono text-sm">{pair}</span>
                      <span className="text-slate-400 text-sm">{count} students</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
