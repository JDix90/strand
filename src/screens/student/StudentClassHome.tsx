import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurriculum } from '../../contexts/CurriculumContext';
import { ClassNotesPanel } from '../../components/class/ClassNotesPanel';
import { fetchClassCurriculum } from '../../lib/curriculumApi';
import type { ClassCurriculumRow } from '../../lib/curriculumApi';
import {
  buildCurriculumNavItems,
  getUnitFromRow,
} from '../../lib/studentCurriculumDisplay';
import { supabase } from '../../lib/supabase';

export function StudentClassHome() {
  const { classId } = useParams<{ classId: string }>();
  const { profile } = useAuth();
  const { setScope } = useCurriculum();
  const [curriculum, setCurriculum] = useState<ClassCurriculumRow[]>([]);
  const [className, setClassName] = useState<string>('');
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    setScope(classId, null);
  }, [classId, setScope]);

  useEffect(() => {
    if (!classId) return;
    (async () => {
      const [{ data: cls }, ccRes] = await Promise.all([
        supabase.from('classes').select('name').eq('id', classId).maybeSingle(),
        fetchClassCurriculum(classId),
      ]);
      if (cls?.name) setClassName(cls.name);
      setCurriculumError(ccRes.error);
      if (ccRes.error) {
        setCurriculum([]);
        return;
      }
      setCurriculum(ccRes.rows.filter(c => c.is_visible).sort((a, b) => a.sort_order - b.sort_order));
    })();
  }, [classId]);

  const navItems = useMemo(
    () => buildCurriculumNavItems(curriculum),
    [curriculum]
  );

  if (!classId) return null;

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{className || 'Your class'}</h1>
          <p className="text-ink-secondary text-sm mt-1">Pick a unit to practice, or use the sidebar.</p>
        </div>
        {curriculumError && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">
            Could not load curriculum: {curriculumError}
          </div>
        )}
        <ul className="space-y-2">
          {navItems.map(item => {
            if (item.kind === 'vocabulary_hub') {
              const first = getUnitFromRow(item.rows[0]);
              const subtitle =
                first?.topics?.title?.trim() ||
                'Browse all vocabulary categories for this class.';
              return (
                <li key="vocabulary-hub">
                  <Link
                    to={`/class/${classId}/vocabulary`}
                    className="block rounded-xl border border-border bg-surface-elevated hover:border-border-strong px-4 py-3 transition-colors"
                  >
                    <span className="font-semibold text-ink">Vocabulary</span>
                    <span className="block text-ink-secondary text-sm mt-1">{subtitle}</span>
                  </Link>
                </li>
              );
            }
            if (item.kind === 'cases_hub') {
              return (
                <li key="cases-hub">
                  <Link
                    to={`/class/${classId}/cases`}
                    className="block rounded-xl border border-border bg-surface-elevated hover:border-border-strong px-4 py-3 transition-colors"
                  >
                    <span className="font-semibold text-ink">Grammar - Cases</span>
                    <span className="block text-ink-secondary text-sm mt-1">
                      Pronouns, names, and nouns in all six cases.
                    </span>
                  </Link>
                </li>
              );
            }
            const row = item.row;
            const u = getUnitFromRow(row);
            if (!u) return null;
            return (
              <li key={row.unit_id}>
                <Link
                  to={`/class/${classId}/unit/${row.unit_id}/practice`}
                  className="block rounded-xl border border-border bg-surface-elevated hover:border-border-strong px-4 py-3 transition-colors"
                >
                  <span className="font-semibold text-ink">{u.title}</span>
                  {u.description && (
                    <span className="block text-ink-secondary text-sm mt-1">{u.description}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {curriculum.length === 0 && (
          <p className="text-ink-secondary text-sm">No visible units yet. Check back after your teacher publishes curriculum.</p>
        )}

        {profile && classId && (
          <ClassNotesPanel classId={classId} viewerId={profile.id} canManageClass={false} />
        )}
      </div>
    </div>
  );
}
