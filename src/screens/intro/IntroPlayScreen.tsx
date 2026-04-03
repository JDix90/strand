import { useState } from 'react';
import { IntroScreenHeader } from '../../components/intro/IntroScreenHeader';
import { IntroQuizRunner } from '../../components/intro/IntroQuizRunner';
import { IntroMatchGame } from '../../components/intro/IntroMatchGame';
import { IntroTypingGame } from '../../components/intro/IntroTypingGame';
import { INTRO_QUIZ_DECKS } from '../../data/intro/quizDecks';
import { INTRO_MATCH_SETS } from '../../data/intro/matchPairs';

type Tab = 'quiz' | 'match' | 'typing';

export function IntroPlayScreen() {
  const [tab, setTab] = useState<Tab>('quiz');
  const [quizDeckId, setQuizDeckId] = useState(INTRO_QUIZ_DECKS[0]?.id ?? '');
  const [matchSetId, setMatchSetId] = useState(INTRO_MATCH_SETS[0]?.id ?? '');

  const quizDeck = INTRO_QUIZ_DECKS.find(d => d.id === quizDeckId) ?? INTRO_QUIZ_DECKS[0];
  const matchSet = INTRO_MATCH_SETS.find(s => s.id === matchSetId) ?? INTRO_MATCH_SETS[0];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'quiz', label: 'Quiz' },
    { id: 'match', label: 'Match' },
    { id: 'typing', label: 'Typing' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <IntroScreenHeader title="Games & drills" subtitle="Short activities — progress stays on this device only." />
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="flex rounded-xl bg-slate-900 border border-slate-700 p-1 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'quiz' && quizDeck && (
        <>
          <div className="max-w-lg mx-auto w-full px-4 pt-4">
            <label className="block text-slate-500 text-xs mb-1">Deck</label>
            <select
              value={quizDeck.id}
              onChange={e => setQuizDeckId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-white text-sm"
            >
              {INTRO_QUIZ_DECKS.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <p className="text-slate-500 text-xs mt-2">{quizDeck.description}</p>
          </div>
          <IntroQuizRunner key={quizDeck.id} deck={quizDeck} />
        </>
      )}

      {tab === 'match' && matchSet && (
        <>
          <div className="max-w-xl mx-auto w-full px-4 pt-4">
            <label className="block text-slate-500 text-xs mb-1">Set</label>
            <select
              value={matchSet.id}
              onChange={e => setMatchSetId(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-white text-sm"
            >
              {INTRO_MATCH_SETS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <p className="text-slate-500 text-xs mt-2">{matchSet.description}</p>
          </div>
          <IntroMatchGame key={matchSet.id} pairSet={matchSet} />
        </>
      )}

      {tab === 'typing' && <IntroTypingGame />}
    </div>
  );
}
