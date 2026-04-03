import type { MasteryRecord } from '../types';

/** v1 contract: prerequisite units must reach average mastery before this unit unlocks. */
export interface LockPolicyV1 {
  /** Unit UUIDs that must satisfy mastery before this row is policy-unlocked. */
  requires_unit_ids?: string[];
  /** Average mastery score (0–100) required across forms in each prerequisite unit. Default 50. */
  min_mastery_pct?: number;
}

export function parseLockPolicy(raw: unknown): LockPolicyV1 | null {
  if (raw == null) return null;
  let v: unknown = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const requires = o.requires_unit_ids;
  const ids = Array.isArray(requires)
    ? requires.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : [];
  const minPct = typeof o.min_mastery_pct === 'number' ? o.min_mastery_pct : 50;
  if (ids.length === 0) return null;
  return { requires_unit_ids: ids, min_mastery_pct: minPct };
}

function averageMasteryForUnit(
  masteryRecords: Record<string, MasteryRecord>,
  unitId: string
): number | null {
  const prefix = `${unitId}::`;
  const list = Object.entries(masteryRecords)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, r]) => r);
  if (list.length === 0) return null;
  const sum = list.reduce((s, r) => s + r.masteryScore, 0);
  return sum / list.length;
}

/** Returns true if lock_policy blocks access (prerequisites not met). */
export function isPolicyLocked(
  lockPolicy: unknown,
  masteryRecords: Record<string, MasteryRecord>
): boolean {
  const p = parseLockPolicy(lockPolicy);
  if (!p?.requires_unit_ids?.length) return false;
  const minPct = p.min_mastery_pct ?? 50;
  for (const uid of p.requires_unit_ids) {
    const avg = averageMasteryForUnit(masteryRecords, uid);
    if (avg == null || avg < minPct) return true;
  }
  return false;
}

export function isUnlockTimeLocked(unlockAt: string | null, nowMs: number = Date.now()): boolean {
  if (!unlockAt) return false;
  const t = new Date(unlockAt).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs < t;
}
