import { useEffect, useState } from 'react';
import { fetchClassCurriculum, type ClassCurriculumRow } from '../../lib/curriculumApi';

interface Props {
  classId: string;
}

/**
 * Short onboarding checklist: add units, set visibility; optional copy for unlock / lock_policy.
 */
export function TeacherCurriculumChecklist({ classId }: Props) {
  const [rows, setRows] = useState<ClassCurriculumRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchClassCurriculum(classId).then(res => {
      if (cancelled) return;
      setLoadError(res.error);
      setRows(res.rows);
    });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const hasUnits = rows.length > 0;
  const hasVisible = rows.some(r => r.is_visible);

  const scrollToCurriculum = () => {
    document.getElementById('class-curriculum')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/60 px-5 py-4">
      <h2 className="text-ink text-sm font-semibold uppercase tracking-wider mb-3">
        Curriculum checklist
      </h2>
      {loadError ? (
        <p className="text-amber-400 text-sm">Could not load curriculum status: {loadError}</p>
      ) : (
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className={hasUnits ? 'text-emerald-400' : 'text-ink-secondary'} aria-hidden>
              {hasUnits ? '✓' : '○'}
            </span>
            <span className={hasUnits ? 'text-ink' : 'text-ink-secondary'}>
              Add units from the catalog to this class.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={hasVisible ? 'text-emerald-400' : 'text-ink-secondary'} aria-hidden>
              {hasVisible ? '✓' : '○'}
            </span>
            <span className={hasVisible ? 'text-ink' : 'text-ink-secondary'}>
              Set at least one unit <strong className="text-ink-secondary">visible</strong> so students see it in the sidebar.
            </span>
          </li>
          <li className="flex items-start gap-2 text-ink-secondary">
            <span className="text-ink-secondary" aria-hidden>
              ·
            </span>
            <span>
              Optional: use <strong className="text-ink-secondary">Unlock at</strong> for timed releases. Advanced prerequisite
              rules use JSON in <code className="text-ink-secondary text-xs">lock_policy</code> — see{' '}
              <code className="text-ink-secondary text-xs">docs/curriculum-lock-policy.md</code> in the repo.
            </span>
          </li>
        </ol>
      )}
      <button
        type="button"
        onClick={scrollToCurriculum}
        className="mt-4 text-sm font-semibold text-link hover:text-link"
      >
        Jump to curriculum section
      </button>
    </div>
  );
}
