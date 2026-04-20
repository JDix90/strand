import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateQuestion } from '../../lib/questionGenerator';
import { QuestionCard } from '../../components/game/QuestionCard';
import { AnswerButton } from '../../components/ui/AnswerButton';
import { BrandLogo } from '../../components/brand/BrandLogo';

const MODE_PREVIEWS = [
  {
    title: 'Learn Table',
    description: 'Study the full declension grid with interactive highlighting.',
    icon: '📋',
    color: '#3b82f6',
    tag: 'Study',
  },
  {
    title: 'Practice',
    description: 'Adaptive fill-in-the-blank that targets weak forms.',
    icon: '🎯',
    color: '#22c55e',
    tag: 'Core',
  },
  {
    title: 'Speed Round',
    description: 'Answer as many as you can before time runs out.',
    icon: '⚡',
    color: '#f59e0b',
    tag: 'Timed',
  },
  {
    title: 'Boss Battle',
    description: 'Deal damage with correct answers in a team-style fight.',
    icon: '⚔️',
    color: '#ef4444',
    tag: 'Challenge',
  },
  {
    title: 'Memory Match',
    description: 'Match prompts to the correct declined forms.',
    icon: '🃏',
    color: '#a855f7',
    tag: 'Recognition',
  },
  {
    title: 'Grid Challenge',
    description: 'Fill declension grids from memory for full mastery.',
    icon: '🔲',
    color: '#14b8a6',
    tag: 'Mastery',
  },
] as const;

const DEMO_FORM_KEYS = [
  'ty:accusative',
  'ya:dative',
  'on:genitive',
  'my:instrumental',
  'ty:genitive',
  'on:accusative',
  'my:nominative',
] as const;

/** Ephemeral demo-only counter; never mixed with signed-in progress (`cd_*` keys). */
const DEMO_SCORE_KEY = 'demo_landing_score';

function readDemoScore(): number {
  try {
    const v = localStorage.getItem(DEMO_SCORE_KEY);
    if (v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(9999, Math.max(0, n)) : 0;
  } catch {
    return 0;
  }
}

export function LandingScreen() {
  const [demoRotate, setDemoRotate] = useState(0);
  const [demoScore, setDemoScore] = useState(() => readDemoScore());
  const demoQuestion = useMemo(() => {
    const key = DEMO_FORM_KEYS[demoRotate % DEMO_FORM_KEYS.length];
    return generateQuestion('practice', 'standard', undefined, [], key, ['pronoun']);
  }, [demoRotate]);

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const answered = pickedIndex !== null;
  const isCorrect = answered && demoQuestion ? pickedIndex === demoQuestion.correctIndex : false;

  useEffect(() => {
    try {
      localStorage.setItem(DEMO_SCORE_KEY, String(demoScore));
    } catch {
      /* ignore */
    }
  }, [demoScore]);

  const handlePick = (index: number) => {
    if (!demoQuestion || answered) return;
    setPickedIndex(index);
    if (index === demoQuestion.correctIndex) {
      setDemoScore(s => s + 1);
    }
  };

  const handleTryAnother = () => {
    setPickedIndex(null);
    setDemoRotate(r => r + 1);
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-border/80 bg-page/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" to="/" />
            <span className="text-ink-secondary text-sm hidden sm:inline">Russian declension practice</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-ink-secondary hover:text-ink px-3 py-2 rounded-xl hover:bg-surface transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-ink bg-brand hover:bg-brand-hover px-4 py-2 rounded-xl transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-16">
        <section className="text-center max-w-2xl mx-auto space-y-5">
          <p className="text-link text-sm font-semibold uppercase tracking-wider">Free to try</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink leading-tight">
            Master Russian cases with adaptive drills and classroom-ready curriculum
          </h1>
          <p className="text-ink-secondary text-lg leading-relaxed">
            Practice pronouns, names, and nouns across all six cases. Teachers can run classes, assign
            units, and track progress—learners get streaks, review queues, and multiple game modes in
            one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors"
            >
              Get started
            </Link>
            <a
              href="#try-it"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border-strong text-ink hover:bg-surface font-semibold transition-colors"
            >
              Try a sample question
            </a>
          </div>
        </section>

        <section id="try-it" className="scroll-mt-24 space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-ink">Sample practice question</h2>
            <p className="text-ink-secondary text-sm max-w-lg mx-auto">
              This is the same style as Practice mode—no account required for this preview. Your real
              sessions save progress when you sign in.
            </p>
            <p className="text-ink-secondary text-xs max-w-lg mx-auto">
              Demo score: <span className="text-ink font-semibold tabular-nums">{demoScore}</span> (stored only in this
              browser for fun — not your real profile.)
            </p>
          </div>

          {demoQuestion ? (
            <div className="max-w-xl mx-auto space-y-6">
              <QuestionCard question={demoQuestion} showHelper />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoQuestion.choices.map((choice, i) => {
                  let state: 'default' | 'correct' | 'wrong' | 'disabled' = 'default';
                  if (answered) {
                    if (i === demoQuestion.correctIndex) state = 'correct';
                    else if (i === pickedIndex) state = 'wrong';
                    else state = 'disabled';
                  }
                  return (
                    <AnswerButton
                      key={`${choice}-${i}`}
                      label={choice}
                      index={i}
                      state={state}
                      onClick={() => handlePick(i)}
                    />
                  );
                })}
              </div>
              {answered && (
                <div className="rounded-2xl border border-border bg-surface-elevated/95 px-4 py-3 text-center space-y-3">
                  <p className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {isCorrect ? 'Correct — nice work!' : 'Not quite — the highlighted answer is correct.'}
                  </p>
                  <p className="text-ink-secondary text-sm leading-relaxed">{demoQuestion.template.explanation}</p>
                  <button
                    type="button"
                    onClick={handleTryAnother}
                    className="text-sm font-semibold text-link hover:text-link"
                  >
                    Next sample question
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-ink-secondary text-sm">Could not load a sample question.</p>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-border bg-surface-elevated/40 px-5 py-8 space-y-3 text-center">
          <p className="text-2xl" aria-hidden>
            ⚡
          </p>
          <h2 className="text-lg font-bold text-ink">Speed round teaser</h2>
          <p className="text-ink-secondary text-sm max-w-md mx-auto leading-relaxed">
            Answer as many questions as you can before time runs out — ideal for fluency drills next to slow Practice. Unlock
            Speed (and streaks, goals, and class sync) after you create an account.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center text-sm font-semibold text-link hover:text-link"
          >
            Sign up to play Speed →
          </Link>
        </section>

        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-ink">Modes and activities</h2>
            <p className="text-ink-secondary text-sm max-w-xl mx-auto">
              Sign in to unlock every mode, sync progress across devices, and join a class when your
              teacher provides a code.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODE_PREVIEWS.map(mode => (
              <div
                key={mode.title}
                className="bg-surface-elevated/80 border border-border rounded-2xl p-5 text-left hover:border-border-strong transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-2xl">{mode.icon}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: mode.color + '22', color: mode.color }}
                  >
                    {mode.tag}
                  </span>
                </div>
                <h3 className="text-ink font-bold mb-1">{mode.title}</h3>
                <p className="text-ink-secondary text-sm leading-relaxed">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-linear-to-br from-surface-elevated to-page p-8 sm:p-10 text-center space-y-4">
          <h2 className="text-xl font-bold text-ink">Ready to learn?</h2>
          <p className="text-ink-secondary max-w-md mx-auto">
            Create a free account to save mastery, join classes, and pick up where you left off on any
            device.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border-strong text-ink hover:bg-surface font-semibold transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-ink-secondary text-sm">
        Languini — Russian nominal declension practice
      </footer>
    </div>
  );
}
