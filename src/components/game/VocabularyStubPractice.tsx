import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SessionSummary } from '../../types';

/** Minimal food deck — matches seed `deckId: food_basic` intent. */
const FOOD_DECK: { prompt: string; choices: string[]; correct: string }[] = [
  { prompt: 'Translate: хлеб', choices: ['bread', 'milk', 'water', 'cheese'], correct: 'bread' },
  { prompt: 'Translate: молоко', choices: ['bread', 'milk', 'apple', 'tea'], correct: 'milk' },
  { prompt: 'Translate: вода', choices: ['water', 'wine', 'juice', 'soup'], correct: 'water' },
];

interface Props {
  resultsPath: string;
  unitId: string;
  topicId: string | null | undefined;
  addSessionSummary: (s: SessionSummary, opts?: { syncToCloud?: boolean }) => void;
  backPath: string;
}

export function VocabularyStubPractice({
  resultsPath,
  unitId,
  topicId,
  addSessionSummary,
  backPath,
}: Props) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const q = FOOD_DECK[idx];

  const handlePick = (choice: string) => {
    if (picked || !q) return;
    setPicked(choice);
    const ok = choice === q.correct;
    const nextCorrect = correctTotal + (ok ? 1 : 0);
    const isLast = idx + 1 >= FOOD_DECK.length;
    setTimeout(() => {
      if (isLast) {
        const n = FOOD_DECK.length;
        const summary: SessionSummary = {
          id: Date.now().toString(),
          modeId: 'practice',
          unitId,
          topicId: topicId ?? undefined,
          score: nextCorrect * 100,
          accuracy: n > 0 ? nextCorrect / n : 0,
          averageResponseMs: 0,
          totalQuestions: n,
          correctAnswers: nextCorrect,
          bestStreak: nextCorrect,
          weakForms: [],
          confusionPairsHit: [],
          completedAt: new Date().toISOString(),
          categories: [],
        };
        addSessionSummary(summary);
        navigate(resultsPath, { state: { summary } });
        return;
      }
      setCorrectTotal(nextCorrect);
      setIdx(i => i + 1);
      setPicked(null);
    }, 450);
  };

  if (!q) return null;

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-ink font-bold">Vocabulary (preview)</span>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="text-ink-secondary hover:text-ink text-sm"
        >
          Close
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <p className="text-ink-secondary text-xs mb-2">
          Question {idx + 1} of {FOOD_DECK.length}
        </p>
        <p className="text-xl font-semibold text-ink text-center mb-8">{q.prompt}</p>
        <div className="grid grid-cols-2 gap-3 w-full">
          {q.choices.map(choice => (
            <button
              key={choice}
              type="button"
              disabled={!!picked}
              onClick={() => handlePick(choice)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                picked
                  ? choice === q.correct
                    ? 'bg-emerald-900 text-emerald-100 border border-emerald-600'
                    : choice === picked
                      ? 'bg-red-900/80 text-red-100 border border-red-700'
                      : 'bg-surface text-ink-secondary border border-border'
                  : 'bg-surface hover:bg-surface-muted text-ink border border-border-strong'
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
        <p className="text-ink-secondary text-xs text-center mt-8">
          Short preview deck — full flashcards can replace this UI later.
        </p>
      </div>
    </div>
  );
}
