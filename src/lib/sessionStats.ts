import type { CaseId, SessionAnswerEvent } from '../types';
import { caseOrder } from '../data/caseMetadata';

export function accuracyByCase(events: SessionAnswerEvent[]): Record<CaseId, { correct: number; total: number }> {
  const base = Object.fromEntries(
    caseOrder.map(caseId => [caseId, { correct: 0, total: 0 }])
  ) as Record<CaseId, { correct: number; total: number }>;

  for (const event of events) {
    const bucket = base[event.targetCaseId];
    bucket.total += 1;
    if (event.wasCorrect) bucket.correct += 1;
  }

  return base;
}
