import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import type { WordCategory } from '../../types';
import type { IntroQuizDeck } from '../../data/intro/quizDecks';

interface Props {
  deck: IntroQuizDeck;
}

export function IntroQuizRunner({ deck }: Props) {
  const navigate = useNavigate();
  const addSessionSummary = useGameStore(s => s.addSessionSummary);
  const [idx, setIdx] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const q = deck.questions[idx];

  const finish = (nextCorrect: number) => {
    const n = deck.questions.length;
    const summary = {
      id: `intro-quiz-${deck.id}-${Date.now()}`,
      modeId: 'practice' as const,
      topicId: 'intro',
      score: nextCorrect * 100,
      accuracy: n > 0 ? nextCorrect / n : 0,
      averageResponseMs: 0,
      totalQuestions: n,
      correctAnswers: nextCorrect,
      bestStreak: nextCorrect,
      weakForms: [],
      confusionPairsHit: [],
      completedAt: new Date().toISOString(),
      categories: [] as WordCategory[],
    };
    addSessionSummary(summary, { syncToCloud: false });
    navigate('/results', { state: { summary, fromIntro: true } });
  };

  const handlePick = (choice: string) => {
    if (picked || !q) return;
    setPicked(choice);
    const ok = choice === q.correct;
    const nextCorrect = correctTotal + (ok ? 1 : 0);
    const isLast = idx + 1 >= deck.questions.length;
    setTimeout(() => {
      if (isLast) {
        finish(nextCorrect);
        return;
      }
      setCorrectTotal(nextCorrect);
      setIdx(i => i + 1);
      setPicked(null);
    }, 450);
  };

  if (!q) return null;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
      <p className="text-slate-500 text-xs mb-2">
        Question {idx + 1} of {deck.questions.length}
      </p>
      <p className="text-xl font-semibold text-white text-center mb-8">{q.prompt}</p>
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
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
