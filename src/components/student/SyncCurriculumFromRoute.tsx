import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCurriculum } from '../../contexts/CurriculumContext';
import { recordLastVisitedUnit } from '../../lib/studentNavigation';

/** Keeps CurriculumContext in sync with `/class/:classId/unit/:unitId/*` route params. */
export function SyncCurriculumFromRoute() {
  const { classId, unitId } = useParams<{ classId: string; unitId: string }>();
  const { setScope } = useCurriculum();

  useEffect(() => {
    setScope(classId ?? null, unitId ?? null);
  }, [classId, unitId, setScope]);

  useEffect(() => {
    if (classId && unitId) recordLastVisitedUnit(classId, unitId);
  }, [classId, unitId]);

  return null;
}
