import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { generateQuestion, type GeneratedQuestion } from '../../lib/questionGenerator';
import {
  createMasteryRecord,
  updateMasteryRecord,
  enqueueFromEvent,
  advanceQueue,
  selectNextAdaptiveFormKey,
  consumeQueueItem,
} from '../../lib/adaptiveEngine';
import { masteryStorageKey, filterMasteryRecordsByUnit } from '../../lib/masteryKeys';
import { isVocabularyModule } from '../../lib/contentModules';
import { practiceSessionQuestionCap, practiceTimeGoalMs } from '../../lib/sessionGoals';
import { VocabularyPractice } from '../../components/game/VocabularyPractice';
import { AnswerButton } from '../../components/ui/AnswerButton';
import { FeedbackPanel } from '../../components/ui/FeedbackPanel';
import { QuestionCard } from '../../components/game/QuestionCard';
import { StreakDisplay } from '../../components/ui/StreakDisplay';
import { ScorePill } from '../../components/ui/ScorePill';
import { CurriculumScopeBar } from '../../components/curriculum/CurriculumScopeBar';
import type { SessionAnswerEvent, SessionSummary } from '../../types';

type Phase = 'question' | 'feedback' | 'complete';

export function PracticeScreen() {
  const navigate = useNavigate();
  const { settings, masteryRecords, adaptiveQueue, updateMasteryRecord: storeMastery, setAdaptiveQueue, addSessionSummary } =
    useGameStore();
  const { effectiveCategories, filterCaseIds, contentModule, topicId, classId, unitId: ctxUnitId, unitRow } =
    useCurriculum();
  const unitId = useEffectiveUnitId();

  const maxQuestions = practiceSessionQuestionCap(settings);
  const timeGoalMs = practiceTimeGoalMs(settings);
  const sessionStartRef = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  const [phase, setPhase] = useState<Phase>('question');
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<('default' | 'correct' | 'wrong' | 'disabled')[]>([
    'default',
    'default',
    'default',
    'default',
  ]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [events, setEvents] = useState<SessionAnswerEvent[]>([]);
  const [recentFormKeys, setRecentFormKeys] = useState<string[]>([]);
  const [localQueue, setLocalQueue] = useState(adaptiveQueue);
  const [localMastery, setLocalMastery] = useState(() => filterMasteryRecordsByUnit(masteryRecords, unitId));
  const presentedAtRef = useRef<number>(Date.now());
  const usedIds = useRef<string[]>([]);

  const categories = effectiveCategories;

  useEffect(() => {
    setLocalMastery(filterMasteryRecordsByUnit(masteryRecords, unitId));
  }, [masteryRecords, unitId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - sessionStartRef.current);
    }, 400);
    return () => clearInterval(id);
  }, []);

  const resultsPath = useMemo(() => {
    if (classId && ctxUnitId) return `/class/${classId}/unit/${ctxUnitId}/results`;
    return '/results';
  }, [classId, ctxUnitId]);

  const loadNextQuestion = useCallback(() => {
    if (isVocabularyModule(contentModule)) return;

    const confusionCounts: Record<string, number> = {};
    for (const record of Object.values(localMastery)) {
      if (record.confusionWith.length > 0) {
        const sk = masteryStorageKey(unitId, record.formKey);
        confusionCounts[sk] = record.confusionWith.length;
      }
    }

    const adaptiveFormKey = selectNextAdaptiveFormKey(
      localQueue,
      localMastery,
      recentFormKeys,
      confusionCounts,
      categories,
      unitId
    );

    let q: GeneratedQuestion | null = null;
    if (adaptiveFormKey) {
      q = generateQuestion(
        'practice',
        settings.difficulty,
        filterCaseIds,
        [],
        adaptiveFormKey,
        categories
      );
      if (q) {
        const newQueue = consumeQueueItem(localQueue, adaptiveFormKey, unitId);
        setLocalQueue(newQueue);
      }
    }

    if (!q) {
      q = generateQuestion(
        'practice',
        settings.difficulty,
        filterCaseIds,
        usedIds.current.slice(-10),
        undefined,
        categories
      );
    }

    if (q) {
      usedIds.current = [...usedIds.current, q.template.id].slice(-20);
      setQuestion(q);
      setAnswerState(['default', 'default', 'default', 'default']);
      setSelectedAnswer(null);
      presentedAtRef.current = Date.now();
    }
  }, [
    localQueue,
    localMastery,
    recentFormKeys,
    settings.difficulty,
    categories,
    filterCaseIds,
    unitId,
    contentModule,
  ]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isVocabularyModule(contentModule)) loadNextQuestion();
  }, []);

  const handleAnswer = (choice: string, idx: number) => {
    if (phase !== 'question' || !question) return;

    const answeredAt = Date.now();
    const responseMs = answeredAt - presentedAtRef.current;
    const isCorrect =
      choice === question.template.correctAnswer || (question.template.acceptedAnswers?.includes(choice) ?? false);

    const newStates: ('default' | 'correct' | 'wrong' | 'disabled')[] = question.choices.map((c, i) => {
      if (c === question.template.correctAnswer) return 'correct';
      if (i === idx && !isCorrect) return 'wrong';
      return 'disabled';
    });
    setAnswerState(newStates);
    setSelectedAnswer(choice);

    if (isCorrect) {
      const newStreak = streak + 1;
      const speedBonus = responseMs <= 3500 ? 20 : 0;
      const streakBonus = Math.floor(newStreak / 3) * 10;
      setScore(s => s + 100 + speedBonus + streakBonus);
      setStreak(newStreak);
      setBestStreak(bs => Math.max(bs, newStreak));
      setCorrectCount(c => c + 1);
    } else {
      setStreak(0);
    }
    setQuestionCount(c => c + 1);

    const formKey = `${question.template.targetLemmaId}:${question.template.targetCaseId}:${question.template.correctAnswer}`;
    const event: SessionAnswerEvent = {
      questionId: question.template.id,
      presentedAtMs: presentedAtRef.current,
      answeredAtMs: answeredAt,
      responseMs,
      selectedAnswer: choice,
      correctAnswer: question.template.correctAnswer,
      wasCorrect: isCorrect,
      targetCaseId: question.template.targetCaseId,
      targetLemmaId: question.template.targetLemmaId,
      modeId: 'practice',
      usedHint: false,
    };
    setEvents(ev => [...ev, event]);
    setRecentFormKeys(rfk => [...rfk, formKey].slice(-20));

    const sk = masteryStorageKey(unitId, formKey);
    const existing = localMastery[sk] ?? createMasteryRecord(formKey, unitId);
    const updated = updateMasteryRecord(existing, event);
    const newMastery = { ...localMastery, [sk]: updated };
    setLocalMastery(newMastery);
    storeMastery(updated);

    const newQueue = enqueueFromEvent(advanceQueue(localQueue), event, updated);
    setLocalQueue(newQueue);
    setAdaptiveQueue(newQueue);

    setPhase('feedback');
  };

  const shouldEndSession = useCallback(() => {
    if (questionCount >= maxQuestions) return true;
    if (timeGoalMs && elapsedMs >= timeGoalMs && questionCount >= 1) return true;
    return false;
  }, [questionCount, maxQuestions, timeGoalMs, elapsedMs]);

  const handleContinue = () => {
    if (shouldEndSession()) {
      const summary: SessionSummary = {
        id: Date.now().toString(),
        modeId: 'practice',
        unitId,
        topicId: topicId ?? undefined,
        score,
        accuracy: questionCount > 0 ? correctCount / questionCount : 0,
        averageResponseMs: events.length > 0 ? events.reduce((s, e) => s + e.responseMs, 0) / events.length : 0,
        totalQuestions: questionCount,
        correctAnswers: correctCount,
        bestStreak,
        weakForms: [],
        confusionPairsHit: [],
        completedAt: new Date().toISOString(),
        categories,
      };
      const sessionGoalMet =
        (settings.sessionGoalType === 'forms' &&
          settings.sessionGoalForms != null &&
          questionCount >= settings.sessionGoalForms) ||
        (settings.sessionGoalType === 'time' && timeGoalMs != null && elapsedMs >= timeGoalMs && questionCount >= 1);
      addSessionSummary(summary);
      navigate(resultsPath, { state: { summary, sessionGoalMet } });
      return;
    }
    setPhase('question');
    loadNextQuestion();
  };

  if (isVocabularyModule(contentModule)) {
    const backPath = classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home';
    return (
      <VocabularyPractice
        unitRow={unitRow}
        resultsPath={resultsPath}
        unitId={unitId}
        topicId={topicId}
        addSessionSummary={addSessionSummary}
        backPath={backPath}
      />
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center text-ink-secondary">Loading...</div>
    );
  }

  const goalProgressLabel =
    timeGoalMs != null
      ? `${Math.min(100, Math.round((elapsedMs / timeGoalMs) * 100))}% time`
      : settings.sessionGoalType === 'forms' && settings.sessionGoalForms
        ? `${questionCount} / ${maxQuestions} answers`
        : null;

  const progressBarPct = timeGoalMs
    ? Math.min(100, (elapsedMs / timeGoalMs) * 100)
    : Math.min(100, maxQuestions > 0 ? (questionCount / maxQuestions) * 100 : 0);

  return (
    <div className="min-h-screen bg-page text-ink">
      <CurriculumScopeBar />
      <div className="bg-surface-elevated border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Close practice"
              onClick={() => navigate(classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home')}
              className="text-ink-secondary hover:text-ink shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-xl"
            >
              ✕
            </button>
            <span className="text-ink font-bold truncate">🎯 Practice</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <StreakDisplay streak={streak} />
            <ScorePill score={score} icon="⭐" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2">
        <div className="flex justify-between text-xs text-ink-secondary mb-1 gap-2">
          <span>
            Question {questionCount + 1} of {maxQuestions}
          </span>
          <span>{correctCount} correct</span>
        </div>
        {timeGoalMs != null && (
          <div className="flex justify-between text-xs text-ink-secondary">
            <span>Session time</span>
            <span>
              {Math.floor(elapsedMs / 60000)}:
              {String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0')} / {Math.floor(timeGoalMs / 60000)}:
              {String(Math.floor((timeGoalMs % 60000) / 1000)).padStart(2, '0')}
            </span>
          </div>
        )}
        {goalProgressLabel && (
          <p className="text-[11px] text-ink-secondary" aria-hidden>
            Goal: {goalProgressLabel}
          </p>
        )}
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${progressBarPct}%` }}
          />
        </div>
      </div>

      <div
        className="max-w-2xl mx-auto px-4 py-6 space-y-4"
        aria-live="polite"
        aria-relevant="additions text"
      >
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
            correctAnswer={question.template.correctAnswer}
            sentencePrompt={question.template.prompt}
            explanation={question.template.explanation}
            onContinue={handleContinue}
            responseMs={events[events.length - 1]?.responseMs}
          />
        )}
      </div>
    </div>
  );
}
