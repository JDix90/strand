import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { fetchClassCurriculum } from '../../lib/curriculumApi';
import type { CaseId } from '../../types';
import { isDeclensionContentModule, isVocabularyFormKey, parseDeclensionCaseId } from '../../lib/analytics/formKeyParse';
import { averageMasteryScore, type MasteryAggRow } from '../../lib/analytics/aggregateMastery';
import { cohortMedianAverageMastery } from '../../lib/analytics/cohortStats';
import { visibleClassUnitIds } from '../../lib/analytics/classScope';

const CASE_ORDER: CaseId[] = ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'];
const CASE_LABELS: Record<CaseId, string> = {
  nominative: 'Nom',
  genitive: 'Gen',
  dative: 'Dat',
  accusative: 'Acc',
  instrumental: 'Inst',
  prepositional: 'Prep',
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
  unit_id: string;
  content_module?: string | null;
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
  unit_id: string | null;
}

export function StudentDetailScreen() {
  const { t } = useTranslation();
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState<string | null>(null);
  const [masteryRows, setMasteryRows] = useState<MasteryRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [cohortMedian, setCohortMedian] = useState<number | null>(null);
  const [curriculumUnits, setCurriculumUnits] = useState<Set<string>>(new Set());
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
        .select(
          'form_key, unit_id, content_module, attempts, correct, status, mastery_score, confusion_with, last_seen_at',
        )
        .eq('user_id', studentId)
        .order('mastery_score', { ascending: true });
      setMasteryRows((mastery ?? []) as MasteryRow[]);

      const { data: sess } = await supabase
        .from('session_summaries')
        .select('id, mode_id, score, accuracy, total_questions, completed_at, unit_id')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(100);
      setSessions((sess ?? []) as SessionRow[]);

      if (classIdParam) {
        const { data: cls } = await supabase.from('classes').select('name').eq('id', classIdParam).single();
        setClassName(cls?.name ?? null);

        const cur = await fetchClassCurriculum(classIdParam);
        const unitSet = visibleClassUnitIds(cur.rows);
        setCurriculumUnits(unitSet);
        const unitList = [...unitSet];

        const { data: mem } = await supabase
          .from('class_memberships')
          .select('student_id')
          .eq('class_id', classIdParam);
        const sids = (mem ?? []).map(m => m.student_id);

        if (sids.length > 0 && unitList.length > 0) {
          const { data: cohortRows } = await supabase
            .from('mastery_records')
            .select(
              'user_id, form_key, unit_id, content_module, status, attempts, correct, mastery_score, confusion_with',
            )
            .in('user_id', sids)
            .in('unit_id', unitList);
          const med = cohortMedianAverageMastery((cohortRows ?? []) as MasteryAggRow[], sids);
          setCohortMedian(med);
        } else {
          setCohortMedian(null);
        }
      } else {
        setClassName(null);
        setCohortMedian(null);
        setCurriculumUnits(new Set());
      }

      setLoading(false);
    };

    void load();
  }, [studentId, classIdParam]);

  const scopedMastery = useMemo(() => {
    if (!classIdParam || curriculumUnits.size === 0) return masteryRows;
    return masteryRows.filter(r => curriculumUnits.has(r.unit_id));
  }, [classIdParam, curriculumUnits, masteryRows]);

  const scopedSessions = useMemo(() => {
    if (!classIdParam || curriculumUnits.size === 0) return sessions;
    return sessions.filter(s => !s.unit_id || curriculumUnits.has(s.unit_id));
  }, [classIdParam, curriculumUnits, sessions]);

  const studentAvgScoped = useMemo(() => averageMasteryScore(scopedMastery), [scopedMastery]);

  const caseGroups: Record<CaseId, MasteryRow[]> = {
    nominative: [],
    genitive: [],
    dative: [],
    accusative: [],
    instrumental: [],
    prepositional: [],
  };
  const rowsForCases = classIdParam ? scopedMastery : masteryRows;
  for (const row of rowsForCases) {
    if (!isDeclensionContentModule(row.content_module ?? undefined)) continue;
    if (isVocabularyFormKey(row.form_key)) continue;
    const caseId = parseDeclensionCaseId(row.form_key);
    if (caseId && caseGroups[caseId]) caseGroups[caseId].push(row);
  }

  const weakForms = scopedMastery
    .filter(r => r.status === 'shaky' || r.status === 'introduced')
    .sort((a, b) => a.mastery_score - b.mastery_score)
    .slice(0, 8);

  const confusions: string[] = [];
  for (const row of scopedMastery) {
    for (const c of row.confusion_with) {
      const pair = [row.form_key, c].sort().join(' ↔ ');
      if (!confusions.includes(pair)) confusions.push(pair);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary">{t('studentDetail.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-ink-secondary hover:text-ink text-sm mb-2 block"
          >
            ← {t('studentDetail.back')}
          </button>
          <h1 className="text-2xl font-bold text-ink">{studentName}</h1>
          <p className="text-ink-secondary text-sm mt-0.5">
            {scopedMastery.length}{' '}
            {classIdParam ? t('studentDetail.formsTrackedClass') : t('studentDetail.formsTrackedAll')} ·{' '}
            {scopedSessions.length}{' '}
            {t('studentDetail.sessionsShown')}
          </p>
          {classIdParam && className && (
            <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              <p className="text-ink">{t('studentDetail.classScopeBanner', { className })}</p>
              {cohortMedian != null && studentAvgScoped != null && (
                <p className="text-ink-secondary mt-1">
                  {t('studentDetail.cohortCompare', {
                    cohort: cohortMedian,
                    student: studentAvgScoped,
                  })}
                </p>
              )}
              <Link
                to={`/teacher/analytics/${classIdParam}`}
                className="inline-block mt-2 text-link text-sm font-semibold hover:underline"
              >
                {t('studentDetail.openClassAnalytics')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            {t('studentDetail.masteryByCase')}
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
                  <p className="text-ink-secondary text-xs">
                    {mastered}/{total} {t('studentDetail.strongPlus')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {weakForms.length > 0 && (
          <div>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
              {t('studentDetail.weakestForms')}
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

        {confusions.length > 0 && (
          <div>
            <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
              {t('studentDetail.confusionPairs')}
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

        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            {t('studentDetail.recentSessions')}
          </h2>
          {scopedSessions.length === 0 ? (
            <p className="text-ink-secondary text-sm">{t('studentDetail.noSessions')}</p>
          ) : (
            <div className="space-y-2">
              {scopedSessions.map(s => (
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
