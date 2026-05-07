import type { GeneratedQuestion } from './questionGenerator';
import type { SessionAnswerEvent, SessionSummary, WordCategory, MasteryRecord } from '../types';

export function buildConfusionCounts(mastery: Record<string, MasteryRecord>): Record<string, number> {
  const confusionCounts: Record<string, number> = {};
  for (const record of Object.values(mastery)) {
    if (record.confusionWith.length > 0) {
      confusionCounts[record.formKey] = record.confusionWith.length;
    }
  }
  return confusionCounts;
}

export function evaluateAnswer(question: GeneratedQuestion, choice: string, idx: number, responseMs: number, streak: number) {
  const isCorrect =
    choice === question.template.correctAnswer ||
    (question.template.acceptedAnswers?.includes(choice) ?? false);

  const answerState: ('default' | 'correct' | 'wrong' | 'disabled')[] = question.choices.map((c, i) => {
    if (c === question.template.correctAnswer) return 'correct';
    if (i === idx && !isCorrect) return 'wrong';
    return 'disabled';
  });

  const nextStreak = isCorrect ? streak + 1 : 0;
  const speedBonus = isCorrect && responseMs <= 3500 ? 20 : 0;
  const streakBonus = isCorrect ? Math.floor(nextStreak / 3) * 10 : 0;
  const scoreDelta = isCorrect ? 100 + speedBonus + streakBonus : 0;

  return { isCorrect, answerState, nextStreak, scoreDelta };
}

export function buildPracticeEvent(params: {
  question: GeneratedQuestion;
  choice: string;
  presentedAtMs: number;
  answeredAtMs: number;
  responseMs: number;
}): SessionAnswerEvent {
  const { question, choice, presentedAtMs, answeredAtMs, responseMs } = params;
  const { template } = question;
  const isCorrect =
    choice === template.correctAnswer ||
    (template.acceptedAnswers?.includes(choice) ?? false);
  return {
    questionId: template.id,
    presentedAtMs,
    answeredAtMs,
    responseMs,
    selectedAnswer: choice,
    correctAnswer: template.correctAnswer,
    wasCorrect: isCorrect,
    targetCaseId: template.targetCaseId,
    targetLemmaId: template.targetLemmaId,
    modeId: 'practice',
    usedHint: false,
  };
}

export function buildPracticeSummary(params: {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  events: SessionAnswerEvent[];
  bestStreak: number;
  categories: WordCategory[];
}): SessionSummary {
  const { score, totalQuestions, correctAnswers, events, bestStreak, categories } = params;
  return {
    id: Date.now().toString(),
    modeId: 'practice',
    score,
    accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    averageResponseMs: events.length > 0 ? events.reduce((s, e) => s + e.responseMs, 0) / events.length : 0,
    totalQuestions,
    correctAnswers,
    bestStreak,
    weakForms: [],
    confusionPairsHit: [],
    completedAt: new Date().toISOString(),
    categories,
  };
}
