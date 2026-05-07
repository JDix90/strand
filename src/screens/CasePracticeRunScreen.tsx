import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { generateQuestion, type GeneratedQuestion } from '../lib/questionGenerator';
import {
  createMasteryRecord,
  updateMasteryRecord,
  enqueueFromEvent,
  advanceQueue,
  selectNextAdaptiveFormKey,
  consumeQueueItem,
} from '../lib/adaptiveEngine';
import { masteryStorageKey } from '../lib/masteryKeys';
import { FOCUSED_ROUND_QUESTIONS } from '../data/gameConfigs';
import { caseMetadata } from '../data/caseMetadata';
import {
  buildConfusionCounts,
  buildPracticeEvent,
  buildPracticeSummary,
  evaluateAnswer,
} from '../lib/casePracticeSessionService';
import { AnswerButton } from '../components/ui/AnswerButton';
import { FeedbackPanel } from '../components/ui/FeedbackPanel';
import { QuestionCard } from '../components/game/QuestionCard';
import { StreakDisplay } from '../components/ui/StreakDisplay';
import { ScorePill } from '../components/ui/ScorePill';
import type { CaseId, PracticeFocus, SessionAnswerEvent, SessionSummary, WordCategory } from '../types';

type Phase = 'question' | 'feedback' | 'round_complete';

const CATEGORY_LABELS: Record<WordCategory, { label: string; icon: string }> = {
  pronoun: { label: 'Pronouns', icon: '👤' },
  name: { label: 'Names', icon: '🏷️' },
  noun: { label: 'Nouns', icon: '📦' },
};

export function CasePracticeRunScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    settings,
    masteryRecords,
    adaptiveQueue,
    updateMasteryRecord: storeMastery,
    setAdaptiveQueue,
    addSessionSummary,
    pushCurrentSessionEvent,
    clearCurrentSessionEvents,
  } = useGameStore();

  const locationState = location.state as { roundPlan?: PracticeFocus[] } | null;
  const [roundPlan] = useState<PracticeFocus[] | null>(locationState?.roundPlan ?? null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [activeFocus, setActiveFocus] = useState<PracticeFocus | null>(locationState?.roundPlan?.[0] ?? null);
  const [roundQuestionCount, setRoundQuestionCount] = useState(0);
  const [roundCorrectCount, setRoundCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<('default' | 'correct' | 'wrong' | 'disabled')[]>([
    'default', 'default', 'default', 'default',
  ]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [events, setEvents] = useState<SessionAnswerEvent[]>([]);
  const [recentFormKeys, setRecentFormKeys] = useState<string[]>([]);
  const [localQueue, setLocalQueue] = useState(adaptiveQueue);
  const [localMastery, setLocalMastery] = useState(masteryRecords);
  const presentedAtRef = useRef<number>(Date.now());
  const usedIds = useRef<string[]>([]);
  const bestStreakRef = useRef(0);

  const roundCategories = useMemo<WordCategory[]>(
    () => (activeFocus ? [activeFocus.category] : ['pronoun', 'name', 'noun']),
    [activeFocus],
  );
  const roundFilterCaseIds = useMemo<CaseId[] | undefined>(
    () => (activeFocus ? [activeFocus.caseId] : undefined),
    [activeFocus],
  );

  const loadNextQuestion = useCallback((focusOverride?: PracticeFocus | null) => {
    const focus = focusOverride !== undefined ? focusOverride : activeFocus;
    const cats: WordCategory[] = focus ? [focus.category] : roundCategories;
    const cids: CaseId[] | undefined = focus ? [focus.caseId] : roundFilterCaseIds;

    const confusionCounts = buildConfusionCounts(localMastery);

    const adaptiveFormKey = selectNextAdaptiveFormKey(
      localQueue,
      localMastery,
      recentFormKeys,
      confusionCounts,
      cats,
      cids,
    );

    let q: GeneratedQuestion | null = null;
    if (adaptiveFormKey) {
      q = generateQuestion('practice', settings.difficulty, cids, usedIds.current.slice(-10), adaptiveFormKey, cats);
      if (q) {
        const newQueue = consumeQueueItem(localQueue, adaptiveFormKey);
        setLocalQueue(newQueue);
      }
    }

    if (!q) {
      q = generateQuestion('practice', settings.difficulty, cids, usedIds.current.slice(-10), undefined, cats);
    }

    if (q) {
      usedIds.current = [...usedIds.current, q.template.id].slice(-20);
      setQuestion(q);
      setQuestionError(null);
      setAnswerState(['default', 'default', 'default', 'default']);
      setSelectedAnswer(null);
      presentedAtRef.current = Date.now();
    } else {
      setQuestion(null);
      setQuestionError(
        focus
          ? `No questions available for ${CATEGORY_LABELS[focus.category].label} · ${caseMetadata[focus.caseId].label}.`
          : 'No practice questions are available for this filter set.',
      );
    }
  }, [
    activeFocus,
    localMastery,
    localQueue,
    recentFormKeys,
    roundCategories,
    roundFilterCaseIds,
    settings.difficulty,
  ]);

  useEffect(() => {
    if (!question && phase === 'question' && !questionError) {
      loadNextQuestion();
    }
  }, [question, phase, questionError, loadNextQuestion]);

  const finishSession = useCallback(
    (qCount = questionCount, cCount = correctCount, evts = events) => {
      const summary: SessionSummary = buildPracticeSummary({
        score,
        totalQuestions: qCount,
        correctAnswers: cCount,
        events: evts,
        bestStreak: bestStreakRef.current,
        categories: roundCategories,
      });
      addSessionSummary(summary);
      navigate('/results', { state: { summary, fromLesson: 'case-practice' } });
    },
    [questionCount, correctCount, events, score, roundCategories, addSessionSummary, navigate],
  );

  const handleAnswer = (choice: string, idx: number) => {
    if (phase !== 'question' || !question) return;
    const answeredAt = Date.now();
    const responseMs = answeredAt - presentedAtRef.current;
    const answerEval = evaluateAnswer(question, choice, idx, responseMs, streak);
    setAnswerState(answerEval.answerState);
    setSelectedAnswer(choice);

    if (answerEval.isCorrect) {
      setScore(s => s + answerEval.scoreDelta);
      setStreak(answerEval.nextStreak);
      bestStreakRef.current = Math.max(bestStreakRef.current, answerEval.nextStreak);
      setCorrectCount(c => c + 1);
      setRoundCorrectCount(c => c + 1);
    } else {
      setStreak(0);
    }
    setQuestionCount(c => c + 1);
    setRoundQuestionCount(c => c + 1);

    const formKey = `${question.template.targetLemmaId}:${question.template.targetCaseId}`;
    const event: SessionAnswerEvent = buildPracticeEvent({
      question,
      choice,
      presentedAtMs: presentedAtRef.current,
      answeredAtMs: answeredAt,
      responseMs,
    });
    setEvents(ev => [...ev, event]);
    pushCurrentSessionEvent(event);
    setRecentFormKeys(rfk => [...rfk, formKey].slice(-20));

    const sk = masteryStorageKey(formKey);
    const existing = localMastery[sk] ?? createMasteryRecord(formKey);
    const updated = updateMasteryRecord(existing, event);
    const newMastery = { ...localMastery, [sk]: updated };
    setLocalMastery(newMastery);
    storeMastery(updated);

    const newQueue = enqueueFromEvent(advanceQueue(localQueue), event, updated);
    setLocalQueue(newQueue);
    setAdaptiveQueue(newQueue);
    setPhase('feedback');
  };

  const handleContinue = () => {
    if (!roundPlan) return;
    if (roundQuestionCount >= FOCUSED_ROUND_QUESTIONS) {
      if (roundIndex + 1 >= roundPlan.length) {
        finishSession();
      } else {
        setPhase('round_complete');
      }
      return;
    }
    setPhase('question');
    loadNextQuestion();
  };

  const handleNextRound = () => {
    if (!roundPlan) return;
    const newIdx = roundIndex + 1;
    const newFocus = roundPlan[newIdx];
    setRoundIndex(newIdx);
    setActiveFocus(newFocus);
    setRoundQuestionCount(0);
    setRoundCorrectCount(0);
    usedIds.current = [];
    setPhase('question');
    setQuestion(null);
    setAnswerState(['default', 'default', 'default', 'default']);
    setSelectedAnswer(null);
    loadNextQuestion(newFocus);
  };

  if (!roundPlan || roundPlan.length === 0) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-center px-6 gap-3">
        <p className="text-ink-secondary">No round plan selected.</p>
        <button
          type="button"
          onClick={() => navigate('/case-practice')}
          className="px-4 py-2 rounded-xl bg-surface-muted hover:bg-surface text-ink text-sm font-semibold"
        >
          Back to setup
        </button>
      </div>
    );
  }

  if (phase === 'round_complete') {
    const completedFocus = roundPlan[roundIndex];
    const nextFocus = roundPlan[roundIndex + 1];
    const roundAcc = roundQuestionCount > 0 ? roundCorrectCount / roundQuestionCount : 0;
    const completedMeta = caseMetadata[completedFocus.caseId];
    const completedCat = CATEGORY_LABELS[completedFocus.category];
    const nextMeta = nextFocus ? caseMetadata[nextFocus.caseId] : null;
    const nextCat = nextFocus ? CATEGORY_LABELS[nextFocus.category] : null;

    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-ink">Round {roundIndex + 1} of {roundPlan.length} complete</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: completedMeta.color }}>
                {completedMeta.icon} {completedMeta.label}
              </span>
              <span className="text-sm font-medium text-ink">{completedCat.label}</span>
            </div>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-5 flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-ink">{roundCorrectCount}/{roundQuestionCount}</p>
              <p className="text-xs text-ink-secondary mt-0.5">correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{Math.round(roundAcc * 100)}%</p>
              <p className="text-xs text-ink-secondary mt-0.5">accuracy</p>
            </div>
          </div>
          {nextFocus && nextMeta && nextCat && (
            <div className="bg-surface-elevated rounded-xl border border-border px-4 py-3 flex items-center gap-3">
              <p className="text-xs text-ink-secondary shrink-0">Next</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-xs font-semibold" style={{ backgroundColor: nextMeta.color }}>
                {nextMeta.icon} {nextMeta.label}
              </span>
              <span className="text-xs font-medium text-ink">{nextCat.label}</span>
            </div>
          )}
          <div className="space-y-2">
            <button type="button" onClick={handleNextRound} className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold text-base transition-colors">
              Continue to next round
            </button>
            <button type="button" onClick={() => finishSession()} className="w-full py-3 rounded-2xl bg-surface hover:bg-surface-muted text-ink-secondary text-sm font-semibold border border-border transition-colors">
              End session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center text-center px-6 gap-3">
        <p className="text-ink-secondary">{questionError ?? 'Loading...'}</p>
        {questionError && (
          <button
            type="button"
            onClick={() => navigate('/case-practice')}
            className="px-4 py-2 rounded-xl bg-surface-muted hover:bg-surface text-ink text-sm font-semibold"
          >
            Back to setup
          </button>
        )}
      </div>
    );
  }

  const focusedCaseMeta = activeFocus ? caseMetadata[activeFocus.caseId] : null;
  const focusedCatInfo = activeFocus ? CATEGORY_LABELS[activeFocus.category] : null;
  const displayedQuestionNumber = Math.min(
    FOCUSED_ROUND_QUESTIONS,
    phase === 'feedback' ? roundQuestionCount : roundQuestionCount + 1,
  );
  const progressBarPct = Math.min(100, (roundQuestionCount / FOCUSED_ROUND_QUESTIONS) * 100);

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Close practice"
              onClick={() => {
                clearCurrentSessionEvents();
                navigate('/case-practice');
              }}
              className="text-ink-secondary hover:text-ink shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-xl"
            >
              ✕
            </button>
            {focusedCaseMeta && focusedCatInfo && (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-ink font-bold shrink-0">Focused Drill</span>
                <span className="text-ink-secondary text-xs shrink-0">
                  Round {roundIndex + 1}/{roundPlan.length}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-xs font-semibold shrink-0" style={{ backgroundColor: focusedCaseMeta.color }}>
                  {focusedCaseMeta.icon} {focusedCaseMeta.label}
                </span>
                <span className="text-xs font-medium text-ink shrink-0">{focusedCatInfo.label}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StreakDisplay streak={streak} />
            <ScorePill score={score} icon="⭐" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2">
        <div className="flex justify-between text-xs text-ink-secondary mb-1 gap-2">
          <span>Question {displayedQuestionNumber} of {FOCUSED_ROUND_QUESTIONS}</span>
          <span>{roundCorrectCount} correct this round</span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressBarPct}%`,
              backgroundColor: focusedCaseMeta ? focusedCaseMeta.color : undefined,
            }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <QuestionCard question={question} showHelper={settings.showHelperWords} />
        {phase === 'question' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.choices.map((choice, idx) => (
              <AnswerButton
                key={choice}
                label={choice}
                index={idx}
                onClick={() => handleAnswer(choice, idx)}
                state={answerState[idx]}
              />
            ))}
          </div>
        )}
        {phase === 'feedback' && selectedAnswer && (
          <FeedbackPanel
            isCorrect={
              selectedAnswer === question.template.correctAnswer ||
              (question.template.acceptedAnswers?.includes(selectedAnswer) ?? false)
            }
            selectedAnswer={selectedAnswer}
            correctAnswer={question.template.correctAnswer}
            sentencePrompt={question.template.prompt}
            explanation={question.template.explanation}
            helperWord={question.template.helperWord}
            questionPrompt={question.template.questionPrompt}
            targetCaseId={question.template.targetCaseId}
            onContinue={handleContinue}
            responseMs={events[events.length - 1]?.responseMs}
          />
        )}
      </div>
    </div>
  );
}
