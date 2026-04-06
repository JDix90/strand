import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SELECTED_CLASS_STORAGE_KEY } from '../../lib/studentNavigation';

/**
 * Students with at least one class land on `/class/:classId` (class hub + sidebar).
 * Others go to `/home`. Overview remains available via the sidebar link on `/class/...` routes.
 */
export function StudentEntryRoute() {
  const { profile } = useAuth();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', profile.id);

      if (cancelled) return;

      if (error || !data?.length) {
        setTarget('/home');
        return;
      }

      const ids = data.map(m => m.class_id);
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(SELECTED_CLASS_STORAGE_KEY);
      } catch {
        stored = null;
      }
      const classId = stored && ids.includes(stored) ? stored : ids[0];
      setTarget(`/class/${classId}`);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (target === null) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary text-lg">Loading...</div>
      </div>
    );
  }

  return <Navigate to={target} replace />;
}
