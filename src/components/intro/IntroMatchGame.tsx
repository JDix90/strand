import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import type { WordCategory } from '../../types';
import type { MatchPairSet } from '../../data/intro/matchPairs';

type Card = { id: string; text: string; pairId: string; side: 'a' | 'b' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  pairSet: MatchPairSet;
}

export function IntroMatchGame({ pairSet }: Props) {
  const navigate = useNavigate();
  const addSessionSummary = useGameStore(s => s.addSessionSummary);

  const cards = useMemo(() => {
    const out: Card[] = [];
    pairSet.pairs.forEach((p, i) => {
      const pairId = `p${i}`;
      out.push({ id: `${pairId}-l`, text: p.left, pairId, side: 'a' });
      out.push({ id: `${pairId}-r`, text: p.right, pairId, side: 'b' });
    });
    return shuffle(out);
  }, [pairSet]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const n = pairSet.pairs.length;
    const summary = {
      id: `intro-match-${pairSet.id}-${Date.now()}`,
      modeId: 'memory_match' as const,
      topicId: 'intro',
      score: n * 100,
      accuracy: 1,
      averageResponseMs: 0,
      totalQuestions: n,
      correctAnswers: n,
      bestStreak: n,
      weakForms: [],
      confusionPairsHit: [],
      completedAt: new Date().toISOString(),
      categories: [] as WordCategory[],
    };
    addSessionSummary(summary, { syncToCloud: false });
    navigate('/results', { state: { summary, fromIntro: true } });
  }, [addSessionSummary, navigate, pairSet.id, pairSet.pairs.length]);

  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      const t = setTimeout(() => finish(), 600);
      return () => clearTimeout(t);
    }
  }, [matched.size, cards.length, finish]);

  const onCardClick = (card: Card) => {
    if (lock || matched.has(card.id)) return;
    if (flipped.includes(card.id)) return;
    if (flipped.length >= 2) return;

    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length < 2) return;

    const [id1, id2] = next;
    const c1 = cards.find(c => c.id === id1)!;
    const c2 = cards.find(c => c.id === id2)!;
    if (c1.pairId === c2.pairId && c1.side !== c2.side) {
      setMatched(m => new Set([...m, id1, id2]));
      setFlipped([]);
      return;
    }
    setLock(true);
    setTimeout(() => {
      setFlipped([]);
      setLock(false);
    }, 700);
  };

  return (
    <div className="px-4 py-6 max-w-xl mx-auto w-full">
      <p className="text-slate-500 text-sm text-center mb-4">{pairSet.description}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {cards.map(card => {
          const isUp = flipped.includes(card.id) || matched.has(card.id);
          return (
            <button
              key={card.id}
              type="button"
              disabled={matched.has(card.id) || lock}
              onClick={() => onCardClick(card)}
              className={`min-h-[72px] rounded-xl border text-sm font-medium p-2 transition-all ${
                matched.has(card.id)
                  ? 'bg-emerald-950 border-emerald-700 text-emerald-100'
                  : isUp
                    ? 'bg-slate-700 border-slate-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {isUp ? card.text : '?'}
            </button>
          );
        })}
      </div>
      <p className="text-slate-500 text-xs text-center mt-4">
        Matched {matched.size / 2} / {pairSet.pairs.length} pairs
      </p>
    </div>
  );
}
