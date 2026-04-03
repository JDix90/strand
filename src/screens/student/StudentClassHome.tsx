import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCurriculum } from '../../contexts/CurriculumContext';
import { fetchClassCurriculum } from '../../lib/curriculumApi';
import type { ClassCurriculumRow } from '../../lib/curriculumApi';
import { supabase } from '../../lib/supabase';

export function StudentClassHome() {
  const { classId } = useParams<{ classId: string }>();
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

  if (!classId) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{className || 'Your class'}</h1>
          <p className="text-slate-400 text-sm mt-1">Pick a unit to practice, or use the sidebar.</p>
        </div>
        {curriculumError && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">
            Could not load curriculum: {curriculumError}
          </div>
        )}
        <ul className="space-y-2">
          {curriculum.map(row => {
            const u = Array.isArray(row.units) ? row.units[0] : row.units;
            if (!u) return null;
            return (
              <li key={row.unit_id}>
                <Link
                  to={`/class/${classId}/unit/${row.unit_id}/practice`}
                  className="block rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-600 px-4 py-3 transition-colors"
                >
                  <span className="font-semibold text-white">{u.title}</span>
                  {u.description && (
                    <span className="block text-slate-500 text-sm mt-1">{u.description}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {curriculum.length === 0 && (
          <p className="text-slate-500 text-sm">No visible units yet. Check back after your teacher publishes curriculum.</p>
        )}
      </div>
    </div>
  );
}
