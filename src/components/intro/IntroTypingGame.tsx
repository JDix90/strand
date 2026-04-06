import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import type { WordCategory } from '../../types';
import { INTRO_TYPING_PROMPTS } from '../../data/intro/typing';
import { normalizeIntroAnswer } from '../../lib/introTextNormalize';

export function IntroTypingGame() {
  const navigate = useNavigate();
  const addSessionSummary = useGameStore(s => s.addSessionSummary);
  const prompts = INTRO_TYPING_PROMPTS;
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'bad' | null>(null);

  const p = prompts[idx];

  const check = () => {
    if (!p || feedback) return;
    const norm = normalizeIntroAnswer(input);
    const ok = p.accepted.some(a => normalizeIntroAnswer(a) === norm);
    if (ok) {
      setFeedback('ok');
      const nextCorrect = correctCount + 1;
      const nextStreak = streak + 1;
      const finalBestStreak = Math.max(bestStreak, nextStreak);
      setBestStreak(finalBestStreak);
      setTimeout(() => {
        if (idx + 1 >= prompts.length) {
          const n = prompts.length;
          const summary = {
            id: `intro-type-${Date.now()}`,
            modeId: 'practice' as const,
            topicId: 'intro',
            score: nextCorrect * 50,
            accuracy: n > 0 ? nextCorrect / n : 0,
            averageResponseMs: 0,
            totalQuestions: n,
            correctAnswers: nextCorrect,
            bestStreak: finalBestStreak,
            weakForms: [],
            confusionPairsHit: [],
            completedAt: new Date().toISOString(),
            categories: [] as WordCategory[],
          };
          addSessionSummary(summary, { syncToCloud: false });
          navigate('/results', { state: { summary, fromIntro: true } });
          return;
        }
        setCorrectCount(nextCorrect);
        setStreak(nextStreak);
        setIdx(i => i + 1);
        setInput('');
        setFeedback(null);
      }, 500);
    } else {
      setFeedback('bad');
      setStreak(0);
      setTimeout(() => setFeedback(null), 900);
    }
  };

  if (!p) return null;

  return (
    <div className="px-4 py-8 max-w-lg mx-auto w-full space-y-6">
      <div className="flex justify-between text-xs text-ink-secondary">
        <span>
          Prompt {idx + 1} of {prompts.length}
        </span>
        <span>{correctCount} correct</span>
      </div>
      <p className="text-lg text-ink font-medium text-center">{p.prompt}</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && check()}
        className="w-full rounded-xl bg-surface-elevated border border-border-strong px-4 py-3 text-ink text-lg focus:outline-none focus:ring-2 focus:ring-brand"
        placeholder="Type in Russian…"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={feedback === 'ok'}
      />
      {feedback === 'bad' && (
        <p className="text-red-400 text-sm text-center">Try again — check spelling and spaces.</p>
      )}
      <button
        type="button"
        onClick={check}
        disabled={!input.trim() || feedback === 'ok'}
        className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-ink font-semibold"
      >
        Check
      </button>
    </div>
  );
}
