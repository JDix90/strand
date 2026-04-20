import type { ModeId, MasteryRecord } from '../types';
import { fetchClassCurriculum, type ClassCurriculumRow } from './curriculumApi';
import { isPolicyLocked, isUnlockTimeLocked } from './lockPolicy';

/** Persists selected class for home sidebar (must match [StudentHomeLayout](src/layouts/StudentHomeLayout.tsx)). */
export const SELECTED_CLASS_STORAGE_KEY = 'cd_student_sidebar_class';

export function lastUnitStorageKey(classId: string): string {
  return `cd_last_unit_${classId}`;
}

export function recordLastVisitedUnit(classId: string, unitId: string): void {
  try {
    localStorage.setItem(lastUnitStorageKey(classId), unitId);
  } catch {
    /* quota */
  }
}

export type RouteModeSegment = 'learn' | 'practice' | 'speed' | 'boss' | 'memory' | 'grid';

const MODE_TO_SEGMENT: Record<ModeId, RouteModeSegment> = {
  learn_table: 'learn',
  practice: 'practice',
  speed_round: 'speed',
  boss_battle: 'boss',
  memory_match: 'memory',
  grid_challenge: 'grid',
};

export function modeIdToRouteSegment(modeId: ModeId): RouteModeSegment {
  return MODE_TO_SEGMENT[modeId];
}

export function buildClassUnitModePath(classId: string, unitId: string, modeId: ModeId): string {
  const seg = modeIdToRouteSegment(modeId);
  return `/class/${classId}/unit/${unitId}/${seg}`;
}

const FLAT_PATH_BY_MODE: Record<ModeId, string> = {
  learn_table: '/learn',
  practice: '/practice',
  speed_round: '/speed',
  boss_battle: '/boss',
  memory_match: '/memory',
  grid_challenge: '/grid',
};

/**
 * Prefer class-scoped URL when a student has a class and unit; otherwise flat mode path.
 */
export function buildStudentModePath(
  classId: string | null | undefined,
  unitId: string | null | undefined,
  modeId: ModeId,
): string {
  if (classId && unitId) return buildClassUnitModePath(classId, unitId, modeId);
  return FLAT_PATH_BY_MODE[modeId] ?? '/practice';
}

/** Map assignment mode_id string (nullable) to ModeId; default practice. */
export function assignmentModeToModeId(modeId: string | null | undefined): ModeId {
  const m = modeId as ModeId;
  const valid: ModeId[] = [
    'learn_table',
    'practice',
    'speed_round',
    'boss_battle',
    'memory_match',
    'grid_challenge',
  ];
  if (m && valid.includes(m)) return m;
  return 'practice';
}

export function describeRowLock(
  row: ClassCurriculumRow,
  masteryRecords: Record<string, MasteryRecord>
): { locked: boolean; reason?: string } {
  if (isUnlockTimeLocked(row.unlock_at)) {
    return {
      locked: true,
      reason: `Unlocks ${new Date(row.unlock_at!).toLocaleString()}`,
    };
  }
  if (isPolicyLocked(row.lock_policy, masteryRecords)) {
    return {
      locked: true,
      reason: 'Complete prerequisite units first',
    };
  }
  return { locked: false };
}

/**
 * First visible, unlocked unit for class; prefers last visited (localStorage) when valid.
 */
export async function resolveDefaultUnitId(
  classId: string,
  masteryRecords: Record<string, MasteryRecord>
): Promise<string | null> {
  const { rows, error } = await fetchClassCurriculum(classId);
  if (error) return null;
  const candidates = rows
    .filter(r => r.is_visible)
    .filter(r => !describeRowLock(r, masteryRecords).locked)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (candidates.length === 0) return null;
  let last: string | null = null;
  try {
    last = localStorage.getItem(lastUnitStorageKey(classId));
  } catch {
    last = null;
  }
  if (last && candidates.some(c => c.unit_id === last)) return last;
  return candidates[0].unit_id;
}
