import { caseOrder } from '../../data/caseMetadata';
import type { CaseId } from '../../types';
import { isDeclensionContentModule, isVocabularyFormKey, parseDeclensionCaseId } from './formKeyParse';

export interface MasteryAggRow {
  user_id?: string;
  form_key: string;
  unit_id: string;
  content_module?: string | null;
  status: string;
  attempts: number;
  correct: number;
  mastery_score?: number | null;
  confusion_with: string[];
}

/** Per-case totals for declension rows only. */
export function aggregateCaseAccuracy(
  rows: MasteryAggRow[],
): Record<CaseId, { total: number; correct: number; statusCounts: Record<string, number> }> {
  const caseStats = {} as Record<
    CaseId,
    { total: number; correct: number; statusCounts: Record<string, number> }
  >;
  for (const c of caseOrder) {
    caseStats[c] = { total: 0, correct: 0, statusCounts: {} };
  }

  for (const row of rows) {
    if (!isDeclensionContentModule(row.content_module ?? undefined)) continue;
    if (isVocabularyFormKey(row.form_key)) continue;
    const caseId = parseDeclensionCaseId(row.form_key);
    if (!caseId || !caseStats[caseId]) continue;
    caseStats[caseId].total += row.attempts;
    caseStats[caseId].correct += row.correct;
    const st = row.status;
    caseStats[caseId].statusCounts[st] = (caseStats[caseId].statusCounts[st] ?? 0) + 1;
  }
  return caseStats;
}

export function topConfusionPairs(rows: MasteryAggRow[], limit = 10): { pair: string; count: number }[] {
  const confusionMap: Record<string, number> = {};
  for (const row of rows) {
    for (const c of row.confusion_with) {
      const pair = [row.form_key, c].sort().join(' ↔ ');
      confusionMap[pair] = (confusionMap[pair] ?? 0) + 1;
    }
  }
  return Object.entries(confusionMap)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function averageMasteryScore(rows: MasteryAggRow[]): number | null {
  const withScore = rows.filter(r => typeof r.mastery_score === 'number');
  if (withScore.length === 0) return null;
  const sum = withScore.reduce((s, r) => s + (r.mastery_score ?? 0), 0);
  return Math.round(sum / withScore.length);
}

/** Group mastery rows by unit for per-topic stats. */
export function aggregateByUnit(
  rows: MasteryAggRow[],
): Record<string, { count: number; avgMastery: number | null; weak: number }> {
  const byUnit: Record<string, MasteryAggRow[]> = {};
  for (const r of rows) {
    if (!byUnit[r.unit_id]) byUnit[r.unit_id] = [];
    byUnit[r.unit_id].push(r);
  }
  const out: Record<string, { count: number; avgMastery: number | null; weak: number }> = {};
  for (const [uid, list] of Object.entries(byUnit)) {
    const avg = averageMasteryScore(list);
    const weak = list.filter(x => x.status === 'shaky' || x.status === 'introduced').length;
    out[uid] = { count: list.length, avgMastery: avg, weak };
  }
  return out;
}
