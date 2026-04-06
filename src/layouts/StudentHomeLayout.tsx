import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffectiveRole } from '../lib/authRoles';
import { supabase } from '../lib/supabase';
import { StudentCurriculumSidebar } from '../components/student/StudentCurriculumSidebar';
import { SELECTED_CLASS_STORAGE_KEY } from '../lib/studentNavigation';

const CLASS_STORAGE_KEY = SELECTED_CLASS_STORAGE_KEY;

/**
 * Wraps /home: when the user is effectively a student and belongs to at least one class,
 * show the same curriculum sidebar as /class/:id routes so units are visible from home.
 */
export function StudentHomeLayout() {
  const { profile } = useAuth();
  const effectiveRole = useEffectiveRole();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!profile || effectiveRole !== 'student') {
      setLoading(false);
      setClasses([]);
      setSelectedClassId(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadError(null);
      setLoading(true);
      const { data: memberships, error: memErr } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', profile.id);

      if (memErr) {
        if (!cancelled) {
          setLoadError(memErr.message);
          setLoading(false);
        }
        return;
      }

      const classIds = (memberships ?? []).map(m => m.class_id);
      if (classIds.length === 0) {
        if (!cancelled) {
          setClasses([]);
          setSelectedClassId(null);
          setLoading(false);
        }
        return;
      }

      const { data: classRows, error: clsErr } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds);

      if (cancelled) return;

      if (clsErr) {
        setLoadError(clsErr.message);
        setLoading(false);
        return;
      }

      const list = (classRows ?? []).map(c => ({ id: c.id, name: c.name }));
      setClasses(list);

      const stored = localStorage.getItem(CLASS_STORAGE_KEY);
      const initial =
        stored && list.some(c => c.id === stored)
          ? stored
          : list[0]?.id ?? null;
      setSelectedClassId(initial);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, effectiveRole, retryKey]);

  const showSidebar =
    effectiveRole === 'student' && !loading && classes.length > 0 && selectedClassId && !loadError;

  if (!showSidebar) {
    return (
      <>
        {effectiveRole === 'student' && loadError && (
          <div className="bg-red-50 border-b border-red-200 text-red-900 text-sm px-4 py-2 flex items-center justify-between gap-3">
            <span>Could not load classes: {loadError}</span>
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setRetryKey(k => k + 1);
              }}
              className="shrink-0 px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}
        <Outlet />
      </>
    );
  }

  const current = classes.find(c => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-page text-ink flex">
      <StudentCurriculumSidebar
        classId={selectedClassId}
        classLabel={current?.name}
        classOptions={classes.length > 1 ? classes : undefined}
        onClassChange={id => {
          setSelectedClassId(id);
          localStorage.setItem(CLASS_STORAGE_KEY, id);
        }}
        homeTo="/home"
      />
      <main className="flex-1 min-w-0 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
