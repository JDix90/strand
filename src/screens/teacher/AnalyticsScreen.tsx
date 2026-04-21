import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { fetchAllCatalogUnits, fetchClassCurriculum, type UnitRow } from '../../lib/curriculumApi';
import { caseOrder } from '../../data/caseMetadata';
import { visibleClassUnitIds } from '../../lib/analytics/classScope';
import {
  aggregateCaseAccuracy,
  averageMasteryScore,
  topConfusionPairs,
  type MasteryAggRow,
} from '../../lib/analytics/aggregateMastery';
import { computeAttentionScoreV1 } from '../../lib/analytics/attentionScore';
import { bucketSessionsByWeek } from '../../lib/analytics/sessionBuckets';

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  unseen: { label: 'Unseen', color: 'bg-surface-muted' },
  introduced: { label: 'Intro', color: 'bg-yellow-600' },
  shaky: { label: 'Shaky', color: 'bg-orange-600' },
  improving: { label: 'Improving', color: 'bg-brand' },
  strong: { label: 'Strong', color: 'bg-green-600' },
  mastered: { label: 'Mastered', color: 'bg-emerald-500' },
};

interface DbMasteryRow extends MasteryAggRow {
  user_id: string;
}

interface SessionLite {
  user_id: string;
  completed_at: string;
  total_questions: number | null;
  accuracy: number | null;
}

interface RosterRow {
  userId: string;
  displayName: string;
  attention: number;
  avgMastery: number | null;
  sessions30d: number;
  questions30d: number;
  daysSinceActive: number | null;
}

const MS_30D = 30 * 86400000;
const MS_90D = 90 * 86400000;

export function AnalyticsScreen() {
  const { t } = useTranslation();
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [className, setClassName] = useState('');
  const [masteryRows, setMasteryRows] = useState<DbMasteryRow[]>([]);
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; display_name: string | null; last_active_at: string | null }[]>(
    [],
  );
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [curriculumUnitIds, setCurriculumUnitIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAllCatalogUnits().then(setUnits);
  }, []);

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      const { data: cls } = await supabase.from('classes').select('name').eq('id', classId).single();
      setClassName(cls?.name ?? '');

      const cur = await fetchClassCurriculum(classId);
      setCurriculumUnitIds(visibleClassUnitIds(cur.rows));

      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('student_id')
        .eq('class_id', classId);
      const sids = (memberships ?? []).map(m => m.student_id);
      setStudentIds(sids);

      if (sids.length > 0) {
        const { data: mastery } = await supabase
          .from('mastery_records')
          .select(
            'user_id, form_key, unit_id, content_module, status, attempts, correct, mastery_score, confusion_with',
          )
          .in('user_id', sids);
        setMasteryRows((mastery ?? []) as DbMasteryRow[]);

        const since90 = new Date(Date.now() - MS_90D).toISOString();
        const { data: sess } = await supabase
          .from('session_summaries')
          .select('user_id, completed_at, total_questions, accuracy')
          .in('user_id', sids)
          .gte('completed_at', since90);
        setSessions((sess ?? []) as SessionLite[]);

        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name, last_active_at')
          .in('id', sids);
        setProfiles(profs ?? []);
      } else {
        setMasteryRows([]);
        setSessions([]);
        setProfiles([]);
      }

      setLoading(false);
    };

    void load();
  }, [classId]);

  const scopeUnitIds = curriculumUnitIds;

  const filteredRows = useMemo(() => {
    let rows: DbMasteryRow[] = masteryRows;
    if (scopeUnitIds.size > 0) {
      rows = rows.filter(r => scopeUnitIds.has(r.unit_id));
    }
    if (unitFilter === 'all') return rows;
    return rows.filter(r => r.unit_id === unitFilter);
  }, [masteryRows, unitFilter, scopeUnitIds]);

  const caseStats = useMemo(() => aggregateCaseAccuracy(filteredRows), [filteredRows]);
  const topConfusions = useMemo(() => topConfusionPairs(filteredRows, 10), [filteredRows]);

  const roster = useMemo((): RosterRow[] => {
    const now = Date.now();
    const since30 = now - MS_30D;
    const byUserMastery = new Map<string, DbMasteryRow[]>();
    for (const id of studentIds) byUserMastery.set(id, []);
    for (const r of masteryRows) {
      if (scopeUnitIds.size > 0 && !scopeUnitIds.has(r.unit_id)) continue;
      const list = byUserMastery.get(r.user_id);
      if (list) list.push(r);
    }

    const sessions30dByUser = new Map<string, number>();
    const questions30dByUser = new Map<string, number>();
    const lastSessionByUser = new Map<string, number>();
    for (const s of sessions) {
      const t0 = new Date(s.completed_at).getTime();
      if (t0 >= since30) {
        sessions30dByUser.set(s.user_id, (sessions30dByUser.get(s.user_id) ?? 0) + 1);
        questions30dByUser.set(
          s.user_id,
          (questions30dByUser.get(s.user_id) ?? 0) + (s.total_questions ?? 0),
        );
      }
      lastSessionByUser.set(s.user_id, Math.max(lastSessionByUser.get(s.user_id) ?? 0, t0));
    }

    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

    return studentIds.map(uid => {
      const scoped = byUserMastery.get(uid) ?? [];
      const avgMastery = averageMasteryScore(scoped);
      const s30 = sessions30dByUser.get(uid) ?? 0;
      const q30 = questions30dByUser.get(uid) ?? 0;
      const prof = profileMap[uid];
      const lastActiveMs = prof?.last_active_at ? new Date(prof.last_active_at).getTime() : null;
      const lastSess = lastSessionByUser.get(uid);
      const lastTouch = Math.max(lastActiveMs ?? 0, lastSess ?? 0);
      const daysSince =
        lastTouch > 0 ? Math.floor((now - lastTouch) / 86400000) : null;

      const attention = computeAttentionScoreV1({
        avgMastery,
        sessionsLast30d: s30,
        daysSinceLastActivity: daysSince,
      });

      return {
        userId: uid,
        displayName: prof?.display_name ?? 'Unknown',
        attention,
        avgMastery,
        sessions30d: s30,
        questions30d: q30,
        daysSinceActive: daysSince,
      };
    }).sort((a, b) => b.attention - a.attention);
  }, [masteryRows, sessions, studentIds, profiles, scopeUnitIds]);

  const weeklyBuckets = useMemo(() => {
    const since = Date.now() - MS_90D;
    return bucketSessionsByWeek(sessions, since);
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary">{t('analytics.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <button type="button" onClick={() => navigate(-1)} className="text-ink-secondary hover:text-ink text-sm mb-2 block">
            ← {t('analytics.back')}
          </button>
          <h1 className="text-2xl font-bold text-ink">{t('analytics.title')}</h1>
          <p className="text-ink-secondary text-sm mt-0.5">
            {className} · {studentIds.length} {t('analytics.students')}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label htmlFor="unit-filter" className="text-ink-secondary text-sm">
              {t('analytics.unit')}
            </label>
            <select
              id="unit-filter"
              value={unitFilter}
              onChange={e => setUnitFilter(e.target.value)}
              className="bg-surface border border-border-strong text-ink rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">{t('analytics.allUnits')}</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </div>
          <p className="text-ink-secondary text-xs mt-2 max-w-xl">{t('analytics.unitFilterHint')}</p>
          {scopeUnitIds.size === 0 && (
            <p className="text-amber-200/90 text-xs mt-2">{t('analytics.noCurriculumScope')}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {studentIds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-secondary">{t('analytics.noStudents')}</p>
          </div>
        ) : (
          <>
            {/* Roster */}
            <div>
              <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-2">
                {t('analytics.rosterTitle')}
              </h2>
              <p className="text-ink-secondary text-xs mb-4">{t('analytics.rosterHint')}</p>
              <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border text-ink-secondary text-xs uppercase">
                      <th className="px-4 py-3 text-left">{t('analytics.colStudent')}</th>
                      <th className="px-4 py-3 text-right">{t('analytics.colAttention')}</th>
                      <th className="px-4 py-3 text-right">{t('analytics.colAvgMastery')}</th>
                      <th className="px-4 py-3 text-right">{t('analytics.colSessions30')}</th>
                      <th className="px-4 py-3 text-right">{t('analytics.colQuestions30')}</th>
                      <th className="px-4 py-3 text-right">{t('analytics.colStale')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(row => (
                      <tr key={row.userId} className="border-b border-border/50 hover:bg-surface-muted/60">
                        <td className="px-4 py-3">
                          <Link
                            to={`/teacher/student/${row.userId}?classId=${classId}`}
                            className="text-link font-medium hover:underline"
                          >
                            {row.displayName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">{row.attention}</td>
                        <td className="px-4 py-3 text-right text-ink-secondary">
                          {row.avgMastery != null ? `${row.avgMastery}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-ink-secondary">{row.sessions30d}</td>
                        <td className="px-4 py-3 text-right text-ink-secondary">{row.questions30d}</td>
                        <td className="px-4 py-3 text-right text-ink-secondary">
                          {row.daysSinceActive != null ? `${row.daysSinceActive}d` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Weekly activity */}
            {weeklyBuckets.length > 0 && (
              <div>
                <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-2">
                  {t('analytics.weeklyActivity')}
                </h2>
                <p className="text-ink-secondary text-xs mb-4">{t('analytics.weeklyActivityHint')}</p>
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                  {weeklyBuckets.slice(-8).map(b => (
                    <div key={b.week} className="flex items-center gap-3 text-sm">
                      <span className="text-ink-secondary w-24 shrink-0 font-mono text-xs">{b.week}</span>
                      <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand/80 rounded-full"
                          style={{ width: `${Math.min(100, b.count * 8)}%` }}
                        />
                      </div>
                      <span className="text-ink text-xs w-28 text-right">
                        {b.count} {t('analytics.sessions')} · {b.questions} {t('analytics.questions')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Accuracy Bars */}
            <div>
              <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                {t('analytics.accuracyByCase')}
              </h2>
              <div className="space-y-3">
                {caseOrder.map(c => {
                  const s = caseStats[c];
                  const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={c} className="bg-surface border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-ink font-semibold capitalize">{c}</span>
                        <span className="text-ink-secondary font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-surface-muted rounded-full h-2.5">
                        <div
                          className="bg-brand h-2.5 rounded-full transition-all"
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
              <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                {t('analytics.masteryDistribution')}
              </h2>
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="grid grid-cols-6 gap-3">
                  {caseOrder.map(c => {
                    const counts = caseStats[c].statusCounts;
                    const totalForms = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <div key={c} className="text-center">
                        <p className="text-ink-secondary text-xs font-semibold mb-2 capitalize">{c.slice(0, 3)}</p>
                        <div className="space-y-1">
                          {Object.entries(STATUS_DISPLAY).map(([key, info]) => {
                            const count = counts[key] ?? 0;
                            const heightPct = Math.max(4, (count / totalForms) * 100);
                            return (
                              <div key={key} className="relative group">
                                <div
                                  className={`${info.color} rounded-sm mx-auto transition-all`}
                                  style={{
                                    height: `${Math.round(heightPct * 0.4)}px`,
                                    minHeight: '3px',
                                    width: '100%',
                                    opacity: count > 0 ? 1 : 0.15,
                                  }}
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-surface-muted text-ink text-xs px-2 py-0.5 rounded whitespace-nowrap z-10">
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
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {Object.entries(STATUS_DISPLAY).map(([key, info]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-sm ${info.color}`} />
                      <span className="text-ink-secondary text-xs">{info.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {topConfusions.length > 0 && (
              <div>
                <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                  {t('analytics.topConfusions')}
                </h2>
                <div className="space-y-2">
                  {topConfusions.map(({ pair, count }) => (
                    <div
                      key={pair}
                      className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3"
                    >
                      <span className="text-red-300 font-mono text-sm">{pair}</span>
                      <span className="text-ink-secondary text-sm">
                        {count} {t('analytics.hits')}
                      </span>
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
