import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { supabase } from '../../lib/supabase';
import { fetchClassCurriculum, fetchUnitsByIds } from '../../lib/curriculumApi';
import { getUnitFromRow } from '../../lib/studentCurriculumDisplay';
import { buildStudentModePath, SELECTED_CLASS_STORAGE_KEY } from '../../lib/studentNavigation';
import { buildStudySuggestions, type StudySuggestion, type UnitProgressLite } from '../../lib/analytics/suggestions';
import type { MasteryRecord } from '../../types';

function avgMasteryForRecords(recs: MasteryRecord[]): number | null {
  if (recs.length === 0) return null;
  const sum = recs.reduce((s, r) => s + r.masteryScore, 0);
  return Math.round(sum / recs.length);
}

function recordsForUnit(records: Record<string, MasteryRecord>, unitId: string): MasteryRecord[] {
  return Object.values(records).filter(r => r.unitId === unitId);
}

const MS_14D = 14 * 86400000;

export function StudentProgressScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const sessionHistory = useGameStore(s => s.sessionHistory);

  const classIdFromQuery = searchParams.get('classId');
  let storedClassId: string | null = null;
  try {
    storedClassId = localStorage.getItem(SELECTED_CLASS_STORAGE_KEY);
  } catch {
    storedClassId = null;
  }
  const classId = classIdFromQuery ?? storedClassId;

  const [loading, setLoading] = useState(true);
  const [unitProgress, setUnitProgress] = useState<UnitProgressLite[]>([]);
  const [classLabel, setClassLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      if (classId) {
        const cur = await fetchClassCurriculum(classId);
        if (cancelled) return;
        const visible = cur.rows.filter(r => r.is_visible);
        const { data: cls } = await supabase.from('classes').select('name').eq('id', classId).single();
        setClassLabel(cls?.name ?? null);

        const list: UnitProgressLite[] = [];
        for (const row of visible) {
          const unit = getUnitFromRow(row);
          if (!unit) continue;
          const recs = recordsForUnit(masteryRecords, unit.id);
          const lastMs = recs.reduce((m, r) => Math.max(m, new Date(r.lastSeenAt).getTime()), 0);
          list.push({
            unitId: unit.id,
            title: unit.title,
            contentModule: unit.content_module,
            avgMastery: avgMasteryForRecords(recs),
            weakCount: recs.filter(x => x.status === 'shaky' || x.status === 'introduced').length,
            lastSeenAtMs: lastMs || null,
          });
        }
        setUnitProgress(list);
      } else {
        setClassLabel(null);
        const unitIds = [
          ...new Set(
            Object.values(masteryRecords)
              .map(r => r.unitId)
              .filter((x): x is string => Boolean(x)),
          ),
        ];
        const units = await fetchUnitsByIds(unitIds);
        if (cancelled) return;
        const list: UnitProgressLite[] = units.map(u => {
          const recs = recordsForUnit(masteryRecords, u.id);
          const lastMs = recs.reduce((m, r) => Math.max(m, new Date(r.lastSeenAt).getTime()), 0);
          return {
            unitId: u.id,
            title: u.title,
            contentModule: u.content_module,
            avgMastery: avgMasteryForRecords(recs),
            weakCount: recs.filter(x => x.status === 'shaky' || x.status === 'introduced').length,
            lastSeenAtMs: lastMs || null,
          };
        });
        setUnitProgress(list.sort((a, b) => a.title.localeCompare(b.title)));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, masteryRecords]);

  const sessionsLast14d = useMemo(() => {
    const cutoff = Date.now() - MS_14D;
    return sessionHistory.filter(s => new Date(s.completedAt).getTime() >= cutoff).length;
  }, [sessionHistory]);

  const confusionLabels = useMemo(() => {
    const labels: string[] = [];
    const recs = classId
      ? unitProgress.flatMap(u => recordsForUnit(masteryRecords, u.unitId))
      : Object.values(masteryRecords);
    for (const r of recs) {
      for (const c of r.confusionWith) {
        const short = `${r.formKey} ↔ ${c}`;
        if (!labels.includes(short)) labels.push(short);
      }
    }
    return labels.slice(0, 8);
  }, [classId, unitProgress, masteryRecords]);

  const suggestions = useMemo(
    () =>
      buildStudySuggestions({
        classId,
        units: unitProgress,
        sessionsLast14d,
        confusionPairLabels: confusionLabels,
      }),
    [classId, unitProgress, sessionsLast14d, confusionLabels],
  );

  const runSuggestion = (s: StudySuggestion) => {
    const a = s.action;
    switch (a.kind) {
      case 'flat_practice':
        navigate('/practice');
        return;
      case 'class_unit_mode':
        navigate(buildStudentModePath(a.classId, a.unitId, 'practice'));
        return;
      case 'vocabulary_hub':
        navigate(`/class/${a.classId}/vocabulary`);
        return;
      case 'cases_hub':
        navigate(`/class/${a.classId}/cases`);
        return;
      default:
        return;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center text-ink-secondary">
        {t('progress.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link to="/home" className="text-ink-secondary text-sm hover:text-ink">
            ← {t('progress.backHome')}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{t('progress.title')}</h1>
          <p className="text-ink-secondary text-sm mt-1">{t('progress.subtitle')}</p>
          {classId && classLabel && (
            <p className="text-ink-secondary text-xs mt-2">
              {t('progress.classContext', { name: classLabel })}
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider">
              {t('progress.suggestions')}
            </h2>
            <div className="space-y-3">
              {suggestions.map(s => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="text-ink-secondary text-sm mt-1">{s.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => runSuggestion(s)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-brand/20 hover:bg-brand/30 text-ink text-sm font-semibold"
                  >
                    {s.ctaLabel}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-4">
            {t('progress.byTopic')}
          </h2>
          {unitProgress.length === 0 ? (
            <p className="text-ink-secondary text-sm">{t('progress.noTopics')}</p>
          ) : (
            <div className="grid gap-3">
              {unitProgress.map(u => (
                <div
                  key={u.unitId}
                  className="rounded-2xl border border-border bg-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{u.title}</p>
                    <p className="text-ink-secondary text-xs mt-1">
                      {t('progress.avgMastery', { value: u.avgMastery != null ? u.avgMastery : '—' })} ·{' '}
                      {t('progress.weakForms', { count: u.weakCount })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(buildStudentModePath(classId, u.unitId, 'practice'))}
                    className="shrink-0 px-4 py-2 rounded-xl bg-surface-muted hover:bg-surface text-ink text-sm font-semibold"
                  >
                    {t('progress.practice')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="text-ink-secondary text-xs leading-relaxed">{t('progress.disclaimer')}</p>
      </div>
    </div>
  );
}
