import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGameStore } from '../../store/gameStore';
import { supabase } from '../../lib/supabase';
import {
  SELECTED_CLASS_STORAGE_KEY,
  buildClassUnitModePath,
  resolveDefaultUnitId,
} from '../../lib/studentNavigation';
import type { ModeId } from '../../types';

const PATH_TO_MODE: Record<string, ModeId> = {
  learn: 'learn_table',
  practice: 'practice',
  speed: 'speed_round',
  boss: 'boss_battle',
  memory: 'memory_match',
  grid: 'grid_challenge',
};

export function curriculumV2StrictRoutingEnabled(): boolean {
  const v = import.meta.env.VITE_CURRICULUM_V2;
  return v === '1' || v === 'true';
}

/**
 * When `VITE_CURRICULUM_V2` is set, students with a resolvable class+unit are redirected
 * from legacy flat mode routes to `/class/:classId/unit/:unitId/:mode` (default off).
 */
export function CurriculumV2FlatRedirect({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const [ready, setReady] = useState(() => !curriculumV2StrictRoutingEnabled());

  useEffect(() => {
    if (!curriculumV2StrictRoutingEnabled()) {
      setReady(true);
      return;
    }
    if (!profile) {
      return;
    }
    if (profile.role !== 'student') {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', profile.id);

      if (cancelled) return;
      if (error || !data?.length) {
        setReady(true);
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
      const uid = await resolveDefaultUnitId(classId, masteryRecords);
      if (cancelled) return;
      if (!uid) {
        setReady(true);
        return;
      }

      const seg = location.pathname.replace(/^\//, '').split('/')[0] || 'practice';
      const modeId = PATH_TO_MODE[seg] ?? 'practice';
      navigate(buildClassUnitModePath(classId, uid, modeId), { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, masteryRecords, navigate, location.pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
