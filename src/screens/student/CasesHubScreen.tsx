import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchClassCurriculum, type ClassCurriculumRow } from '../../lib/curriculumApi';
import { parseRussianDeclensionConfig } from '../../lib/contentModules';
import { getUnitFromRow, isGrammarCasesRow } from '../../lib/studentCurriculumDisplay';
import { buildClassUnitModePath } from '../../lib/studentNavigation';
import type { WordCategory } from '../../types';

const CASE_CATEGORY_INFO: Record<WordCategory, { label: string; icon: string; description: string }> = {
  pronoun: {
    label: 'Pronouns',
    icon: '👤',
    description: 'Core pronoun forms used in everyday Russian sentence patterns.',
  },
  name: {
    label: 'Names',
    icon: '🏷️',
    description: 'How personal names change by case in common contexts.',
  },
  noun: {
    label: 'Nouns',
    icon: '📦',
    description: 'General noun declensions across all six cases.',
  },
};

export function CasesHubScreen() {
  const { classId } = useParams<{ classId: string }>();
  const [rows, setRows] = useState<ClassCurriculumRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await fetchClassCurriculum(classId);
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setRows([]);
      } else {
        setError(null);
        setRows(
          res.rows
            .filter(r => r.is_visible)
            .filter(isGrammarCasesRow)
            .sort((a, b) => a.sort_order - b.sort_order),
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const firstRow = rows[0] ?? null;
  const availableByCategory = useMemo(() => {
    const map: Record<WordCategory, ClassCurriculumRow | null> = {
      pronoun: null,
      name: null,
      noun: null,
    };
    for (const row of rows) {
      const unit = getUnitFromRow(row);
      if (!unit) continue;
      const cfg = parseRussianDeclensionConfig(unit.content_config);
      for (const cat of cfg.categories) {
        if (!map[cat]) map[cat] = row;
      }
    }
    return map;
  }, [rows]);

  if (!classId) return null;

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Grammar - Cases</h1>
          <p className="text-ink-secondary text-sm mt-1">
            Pick a sub-category, then jump straight into practice for this class.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">
            Could not load case units: {error}
          </div>
        )}

        {loading && <p className="text-ink-secondary text-sm">Loading case categories…</p>}

        {!loading && !error && firstRow == null && (
          <p className="text-ink-secondary text-sm">
            No visible case units yet. Ask your teacher to enable curriculum rows.
          </p>
        )}

        {!loading && firstRow != null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['pronoun', 'name', 'noun'] as WordCategory[]).map(cat => {
              const info = CASE_CATEGORY_INFO[cat];
              const row = availableByCategory[cat] ?? firstRow;
              const unit = getUnitFromRow(row);
              const unitId = row?.unit_id ?? firstRow.unit_id;
              const toPractice = buildClassUnitModePath(classId, unitId, 'practice');
              const toLearn = buildClassUnitModePath(classId, unitId, 'learn_table');
              return (
                <div key={cat} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-xl" aria-hidden>
                      {info.icon}
                    </p>
                    <h2 className="font-semibold text-ink mt-1">{info.label}</h2>
                    <p className="text-xs text-ink-secondary mt-1">{info.description}</p>
                    {unit?.title && <p className="text-[11px] text-ink-secondary mt-2">Unit: {unit.title}</p>}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link
                      to={toPractice}
                      className="flex-1 text-center px-3 py-2 rounded-lg bg-brand/20 text-ink text-sm font-semibold hover:bg-brand/30"
                    >
                      Practice
                    </Link>
                    <Link
                      to={toLearn}
                      className="flex-1 text-center px-3 py-2 rounded-lg bg-surface-muted text-ink text-sm font-semibold hover:bg-surface"
                    >
                      Learn
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
