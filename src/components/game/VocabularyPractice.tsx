'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setResultsState } from '@/lib/navigationState';
import { loadVocabularyDeck } from '../../lib/vocabulary/deckRegistry';
import { buildVocabularySession, type VocabMcQuestion } from '../../lib/vocabulary/questionGenerator';
import { vocabularyFormKey } from '../../lib/vocabulary/masteryFormKey';
import { createMasteryRecord, updateMasteryRecord } from '../../lib/adaptiveEngine';
import { masteryStorageKey } from '../../lib/masteryKeys';
import { useGameStore } from '../../store/gameStore';
import type { SessionAnswerEvent, SessionSummary } from '../../types';
import { buildVocabularySummary } from '../../lib/vocabularySessionService';
import {
  canSpeakLang,
  speakEnglish,
  speakRussian,
  warmSpeechSynthesisVoices,
} from '../../lib/speakRussian';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

interface Props {
  deckIds: string[];
  sessionLength: number;
  direction: 'ru-en' | 'en-ru';
  resultsPath: string;
  addSessionSummary: (s: SessionSummary) => void;
  backPath: string;
  title?: string;
}

export function VocabularyPractice({
  deckIds,
  sessionLength,
  direction,
  addSessionSummary,
  backPath,
  resultsPath,
  title,
}: Props) {
  const router = useRouter();
  const updateMastery = useGameStore(s => s.updateMasteryRecord);
  const deckKey = useMemo(() => [...deckIds].sort().join(','), [deckIds]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [questions, setQuestions] = useState<VocabMcQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [correctTotal, setCorrectTotal] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const weakSessionRef = useRef<string[]>([]);
  const presentedAtRef = useRef<number>(Date.now());
  const setIdByLemmaRef = useRef<Record<string, string>>({});
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const responseTotalRef = useRef(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const deckRows = await Promise.all(deckIds.map(id => loadVocabularyDeck(id)));
        const merged = deckRows.flat();
        const uniq = new Map<string, (typeof merged)[number]>();
        for (const l of merged) {
          if (!uniq.has(l.lemmaId)) uniq.set(l.lemmaId, l);
        }
        const lemmas = [...uniq.values()];
        setIdByLemmaRef.current = Object.fromEntries(lemmas.map(l => [l.lemmaId, l.vocabularySetId]));
        if (cancelled) return;
        if (lemmas.length === 0) {
          setErr('No vocabulary entries for this unit yet.');
          setQuestions([]);
          return;
        }
        const session = buildVocabularySession(
          lemmas,
          sessionLength,
          direction,
        );
        setQuestions(session);
        setIdx(0);
        setCorrectTotal(0);
        weakSessionRef.current = [];
        streakRef.current = 0;
        bestStreakRef.current = 0;
        responseTotalRef.current = 0;
        presentedAtRef.current = Date.now();
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load deck');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    deckIds,
    deckKey,
    sessionLength,
    direction,
  ]);

  useEffect(() => {
    warmSpeechSynthesisVoices();
  }, []);

  const q = questions[idx];
  const speechEnabled = q ? canSpeakLang(q.speakLang) : false;
  const unitTitle = title ?? 'Vocabulary';

  const applyMastery = useCallback(
    (lemmaId: string, wasCorrect: boolean, selected: string, correct: string, responseMs: number) => {
      const dir = direction;
      const setId = setIdByLemmaRef.current[lemmaId] ?? deckIds[0];
      const fk = vocabularyFormKey(setId, lemmaId, dir);
      const sk = masteryStorageKey(fk);
      const prev = useGameStore.getState().masteryRecords[sk] ?? createMasteryRecord(fk);
      const event: SessionAnswerEvent = {
        questionId: fk,
        presentedAtMs: presentedAtRef.current,
        answeredAtMs: Date.now(),
        responseMs,
        selectedAnswer: selected,
        correctAnswer: correct,
        wasCorrect,
        targetCaseId: 'nominative',
        targetLemmaId: lemmaId,
        modeId: 'practice',
        usedHint: false,
      };
      updateMastery(updateMasteryRecord(prev, event));
      if (!wasCorrect && !weakSessionRef.current.includes(fk)) {
        weakSessionRef.current = [...weakSessionRef.current, fk];
      }
    },
    [direction, deckIds, updateMastery],
  );

  const handlePick = (choice: string) => {
    if (picked || !q) return;
    setPicked(choice);
    const ok = norm(choice) === norm(q.correctAnswer);
    const responseMs = Date.now() - presentedAtRef.current;
    responseTotalRef.current += responseMs;
    if (ok) {
      streakRef.current += 1;
      bestStreakRef.current = Math.max(bestStreakRef.current, streakRef.current);
    } else {
      streakRef.current = 0;
    }
    applyMastery(q.lemmaId, ok, choice, q.correctAnswer, responseMs);
    const nextCorrect = correctTotal + (ok ? 1 : 0);
    const isLast = idx + 1 >= questions.length;
    setTimeout(() => {
      if (isLast) {
        const n = questions.length;
        const summary: SessionSummary = {
          ...buildVocabularySummary({
            questions,
            correctAnswers: nextCorrect,
            averageResponseMs: n > 0 ? responseTotalRef.current / n : 0,
            bestStreak: bestStreakRef.current,
          }),
          weakForms: [...weakSessionRef.current],
        };
        addSessionSummary(summary);
        setResultsState({ summary, fromLesson: 'vocabulary' });
        router.push(resultsPath);
        return;
      }
      setCorrectTotal(nextCorrect);
      setIdx(i => i + 1);
      setPicked(null);
      presentedAtRef.current = Date.now();
    }, 450);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page text-ink flex items-center justify-center">
        <p className="text-ink-secondary">Loading vocabulary…</p>
      </div>
    );
  }

  if (err || !q) {
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col">
        <div className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
          <span className="text-ink font-bold">{unitTitle}</span>
          <button type="button" onClick={() => router.push(backPath)} className="text-ink-secondary hover:text-ink text-sm">
            Close
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 text-center text-ink-secondary">
          {err ?? 'No questions available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-ink font-bold">{unitTitle}</span>
        <button type="button" onClick={() => router.push(backPath)} className="text-ink-secondary hover:text-ink text-sm">
          Close
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <p className="text-ink-secondary text-xs mb-2">
          Question {idx + 1} of {questions.length}
        </p>
        <div className="text-center mb-8 space-y-1 max-w-md mx-auto">
          <p className="text-xl font-semibold text-ink flex flex-wrap items-baseline justify-center gap-x-1.5">
            <span>{q.promptPrefix}</span>
            <button
              type="button"
              disabled={!speechEnabled}
              aria-disabled={!speechEnabled}
              aria-label={`Hear pronunciation of ${q.promptTarget}`}
              title={
                speechEnabled
                  ? 'Play pronunciation'
                  : 'Pronunciation not supported in this browser'
              }
              onClick={() => {
                if (q.speakLang === 'ru') speakRussian(q.promptTarget);
                else speakEnglish(q.promptTarget);
              }}
              className={`inline font-semibold underline decoration-dotted decoration-ink/40 underline-offset-4 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
                speechEnabled
                  ? 'text-ink hover:text-link cursor-pointer'
                  : 'text-ink-secondary cursor-not-allowed opacity-70'
              }`}
            >
              {q.promptTarget}
            </button>
          </p>
          {!speechEnabled && (
            <p className="text-xs text-ink-secondary">
              Pronunciation not supported in this browser.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {q.choices.map(choice => (
            <button
              key={choice}
              type="button"
              disabled={!!picked}
              onClick={() => handlePick(choice)}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                picked
                  ? norm(choice) === norm(q.correctAnswer)
                    ? 'bg-emerald-900 text-emerald-100 border border-emerald-600'
                    : norm(choice) === norm(picked)
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
          Russian–English vocabulary · progress is saved per word in this browser.
        </p>
      </div>
    </div>
  );
}
