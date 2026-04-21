import type { MasteryAggRow } from './aggregateMastery';
import { averageMasteryScore } from './aggregateMastery';
import { median } from './attentionScore';

/** Median of per-student average mastery (class-scoped rows). */
export function cohortMedianAverageMastery(rows: MasteryAggRow[], studentIds: string[]): number | null {
  const byUser: Record<string, MasteryAggRow[]> = {};
  for (const id of studentIds) byUser[id] = [];
  for (const r of rows) {
    const uid = r.user_id;
    if (!uid || !byUser[uid]) continue;
    byUser[uid].push(r);
  }
  const avgs: number[] = [];
  for (const uid of studentIds) {
    const avg = averageMasteryScore(byUser[uid] ?? []);
    if (avg != null) avgs.push(avg);
  }
  return median(avgs);
}
