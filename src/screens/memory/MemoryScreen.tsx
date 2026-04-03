import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { getFormsByCategories, CATEGORY_LABELS } from '../../data/allForms';
import { caseMetadata } from '../../data/caseMetadata';
import type { MatchCard, SessionSummary, CaseId, WordCategory } from '../../types';
import { MEMORY_MATCH_FAST_MATCH_THRESHOLD_MS } from '../../data/gameConfigs';

type CardState = 'hidden' | 'flipped' | 'matched' | 'wrong';

interface CardWithState extends MatchCard {
  state: CardState;
}

type MatchType = 'pronoun_form' | 'case_helper' | 'sentence_answer';
type Difficulty = 'easy' | 'medium' | 'hard';

const GRID_SIZES: Record<Difficulty, number> = { easy: 8, medium: 12, hard: 16 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCards(matchType: MatchType, count: number, categories: WordCategory[]): MatchCard[] {
  const cards: MatchCard[] = [];
  const allCategoryForms = getFormsByCategories(categories);
  const forms = shuffle(allCategoryForms).slice(0, count / 2);

  forms.forEach((form, i) => {
    const pairId = `pair_${i}`;
    if (matchType === 'pronoun_form') {
      cards.push({
        id: `p_${i}`, content: form.lemmaDisplay, pairId, type: 'prompt', caseId: form.caseId,
      });
      cards.push({
        id: `a_${i}`, content: `${form.surfaceForm} (${caseMetadata[form.caseId].label})`, pairId, type: 'answer', caseId: form.caseId,
      });
    } else if (matchType === 'case_helper') {
      const caseId = form.caseId as CaseId;
      const meta = caseMetadata[caseId];
      cards.push({
        id: `p_${i}`, content: meta.label, pairId, type: 'prompt', caseId,
      });
      cards.push({
        id: `a_${i}`, content: `${meta.helperWord} (${meta.questionPrompt})`, pairId, type: 'answer', caseId,
      });
    } else {
      cards.push({
        id: `p_${i}`, content: form.exampleSentence.replace(form.surfaceForm, '___'), pairId, type: 'prompt', caseId: form.caseId,
      });
      cards.push({
        id: `a_${i}`, content: form.surfaceForm, pairId, type: 'answer', caseId: form.caseId,
      });
    }
  });

  return shuffle(cards);
}

export function MemoryScreen() {
  const navigate = useNavigate();
  const { addSessionSummary, settings } = useGameStore();
  const { topicId } = useCurriculum();
  const unitId = useEffectiveUnitId();

  /** Categories for this mode only — does not change Home filters. Initialized from Home selection. */
  const [selectedCategories, setSelectedCategories] = useState<WordCategory[]>(() => {
    const a = settings.activeCategories;
    return a.length > 0 ? [...a] : (['pronoun'] as WordCategory[]);
  });

  const sessionCategoriesRef = useRef<WordCategory[]>(selectedCategories);

  const toggleMemoryCategory = (cat: WordCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter(c => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  const [matchType, setMatchType] = useState<MatchType>('pronoun_form');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [phase, setPhase] = useState<'setup' | 'playing' | 'complete'>('setup');
  const [cards, setCards] = useState<CardWithState[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lastFlipRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const movesRef = useRef(0);

  const handleStart = () => {
    sessionCategoriesRef.current = [...selectedCategories];
    const count = GRID_SIZES[difficulty];
    const rawCards = generateCards(matchType, count, selectedCategories);
    setCards(rawCards.map(c => ({ ...c, state: 'hidden' })));
    setTotalPairs(count / 2);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setMatchedCount(0);
    setMoves(0);
    movesRef.current = 0;
    setElapsedSeconds(0);
    setFlipped([]);
    setBestStreak(0);
    setPhase('playing');
  };

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const handleCardClick = (cardId: string) => {
    if (isLocked || phase !== 'playing') return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.state === 'matched' || card.state === 'flipped') return;
    if (flipped.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, state: 'flipped' } : c));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const newMoves = movesRef.current + 1;
      movesRef.current = newMoves;
      setMoves(newMoves);
      setIsLocked(true);
      const [id1, id2] = newFlipped;
      const c1 = cards.find(c => c.id === id1)!;
      const c2 = cards.find(c => c.id === id2)!;
      const now = Date.now(); // eslint-disable-line react-hooks/purity
      const timeSinceFlip = now - lastFlipRef.current;

      if (c1.pairId === c2.pairId) {
        const isFast = timeSinceFlip <= MEMORY_MATCH_FAST_MATCH_THRESHOLD_MS;
        const newStreak = streak + 1;
        const pts = 50 + (isFast ? 20 : 0) + (newStreak > 1 ? (newStreak - 1) * 10 : 0);
        const newScore = scoreRef.current + pts;
        scoreRef.current = newScore;
        setScore(newScore);
        setStreak(newStreak);
        const newBestStreak = Math.max(bestStreak, newStreak);
        setBestStreak(newBestStreak);
        const newMatched = matchedCount + 1;
        setMatchedCount(newMatched);

        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, state: 'matched' } : c
          ));
          setFlipped([]);
          setIsLocked(false);
          if (newMatched >= totalPairs) {
            clearInterval(timerRef.current!);
            const summary: SessionSummary = {
              id: Date.now().toString(),
              modeId: 'memory_match',
              unitId,
              topicId: topicId ?? undefined,
              score: newScore,
              accuracy: newMoves > 0 ? newMatched / newMoves : 1,
              averageResponseMs: 0,
              totalQuestions: totalPairs,
              correctAnswers: newMatched,
              bestStreak: newBestStreak,
              weakForms: [],
              confusionPairsHit: [],
              completedAt: new Date().toISOString(),
              categories: sessionCategoriesRef.current,
            };
            addSessionSummary(summary);
            setPhase('complete');
          }
        }, 600);
      } else {
        setStreak(0);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === id1 || c.id === id2 ? { ...c, state: 'hidden' } : c
          ));
          setFlipped([]);
          setIsLocked(false);
        }, 900);
      }
      lastFlipRef.current = now;
    } else {
      lastFlipRef.current = Date.now(); // eslint-disable-line react-hooks/purity
    }
  };

  const gridCols = difficulty === 'easy' ? 'grid-cols-4' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-4';

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-center space-y-2">
          <div className="text-6xl">🃏</div>
          <h1 className="text-3xl font-bold text-white">Memory Match</h1>
          <p className="text-slate-400">Flip cards to find matching pairs</p>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm space-y-5">
          {/* Category selector */}
          <div>
            <label className="text-slate-300 text-sm font-semibold block mb-1">Word Categories</label>
            <p className="text-slate-500 text-xs mb-2 leading-relaxed">
              Only affects this game. Home filters stay unchanged.
            </p>
            <div className="flex gap-2">
              {(['pronoun', 'name', 'noun'] as WordCategory[]).map(cat => {
                const info = CATEGORY_LABELS[cat];
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleMemoryCategory(cat)}
                    className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${active ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {info.icon} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold block mb-2">Match Type</label>
            <div className="space-y-2">
              {([
                ['pronoun_form', '🔤 Word ↔ Declined Form'],
                ['case_helper', '📚 Case Name ↔ Helper Word'],
                ['sentence_answer', '✏️ Sentence Frame ↔ Answer'],
              ] as [MatchType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setMatchType(type)}
                  className={`w-full py-2 px-4 rounded-xl text-left text-sm font-medium transition-colors ${matchType === type ? 'bg-purple-700 text-white border-2 border-purple-400' : 'bg-slate-700 text-slate-300 border-2 border-slate-600 hover:border-slate-400'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-semibold block mb-2">Grid Size</label>
            <div className="flex gap-3">
              {([['easy', '4×2'], ['medium', '4×3'], ['hard', '4×4']] as [Difficulty, string][]).map(([d, label]) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${difficulty === d ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            Start!
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold text-white">All Matched!</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-sm space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-400">{score.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">Final Score</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-white">{moves}</p>
              <p className="text-slate-500 text-xs">Moves</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-400">{bestStreak}</p>
              <p className="text-slate-500 text-xs">Best Streak</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">{mins}:{String(secs).padStart(2, '0')}</p>
              <p className="text-slate-500 text-xs">Time</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold">Home</button>
          <button onClick={() => setPhase('setup')} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="text-slate-400 hover:text-white">✕</button>
            <span className="text-white font-bold">🃏 Memory Match</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {streak > 1 && <span className="text-orange-400 font-bold">🔥 {streak}</span>}
            <span className="text-white font-bold">{score.toLocaleString()}</span>
            <span className="text-slate-400">{matchedCount}/{totalPairs}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className={`grid ${gridCols} gap-3`}>
          {cards.map(card => {
            const isFlipped = card.state === 'flipped' || card.state === 'matched';
            const isMatched = card.state === 'matched';
            const caseColor = card.caseId ? caseMetadata[card.caseId].color : '#64748b';

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={isMatched || card.state === 'flipped'}
                className={`
                  aspect-[3/4] rounded-xl border-2 flex items-center justify-center p-2 text-center
                  transition-all duration-300 font-semibold text-sm
                  ${isMatched
                    ? 'opacity-40 cursor-default'
                    : isFlipped
                    ? 'cursor-default'
                    : 'cursor-pointer hover:scale-105 hover:border-slate-400'
                  }
                `}
                style={{
                  backgroundColor: isFlipped ? (isMatched ? caseColor + '22' : '#1e293b') : '#0f172a',
                  borderColor: isMatched ? caseColor : isFlipped ? caseColor + '88' : '#334155',
                  color: isFlipped ? (card.type === 'prompt' ? '#e2e8f0' : caseColor) : 'transparent',
                }}
              >
                {isFlipped ? (
                  <span className="leading-tight">{card.content}</span>
                ) : (
                  <span className="text-slate-600 text-2xl">?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
