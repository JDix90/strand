import type { SessionSummary } from '../types';
import type { VocabMcQuestion } from './vocabulary/questionGenerator';

export function buildVocabularySummary(params: {
  questions: VocabMcQuestion[];
  correctAnswers: number;
  averageResponseMs: number;
  bestStreak: number;
}): SessionSummary {
  const { questions, correctAnswers, averageResponseMs, bestStreak } = params;
  const totalQuestions = questions.length;
  return {
    id: Date.now().toString(),
    modeId: 'practice',
    score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 1000) : 0,
    accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    averageResponseMs,
    totalQuestions,
    correctAnswers,
    bestStreak,
    weakForms: [],
    confusionPairsHit: [],
    completedAt: new Date().toISOString(),
    categories: [],
  };
}
