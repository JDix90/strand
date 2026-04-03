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
import { VOCABULARY_STUB_MODULE } from '../../lib/curriculumConstants';
import { VocabularyStubPractice } from '../../components/game/VocabularyStubPractice';
import { AnswerButton } from '../../components/ui/AnswerButton';
import { FeedbackPanel } from '../../components/ui/FeedbackPanel';
import { QuestionCard } from '../../components/game/QuestionCard';
import { StreakDisplay } from '../../components/ui/StreakDisplay';
import { ScorePill } from '../../components/ui/ScorePill';
import type { SessionAnswerEvent, SessionSummary } from '../../types';

type Phase = 'question' | 'feedback' | 'complete';

export function PracticeScreen() {
  const navigate = useNavigate();
  const { settings, masteryRecords, adaptiveQueue, updateMasteryRecord: storeMastery, setAdaptiveQueue, addSessionSummary } =
    useGameStore();
  const { effectiveCategories, filterCaseIds, contentModule, topicId, classId, unitId: ctxUnitId } = useCurriculum();
  const unitId = useEffectiveUnitId();

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

  const resultsPath = useMemo(() => {
    if (classId && ctxUnitId) return `/class/${classId}/unit/${ctxUnitId}/results`;
    return '/results';
  }, [classId, ctxUnitId]);

  const loadNextQuestion = useCallback(() => {
    if (contentModule === VOCABULARY_STUB_MODULE) return;

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
    if (contentModule !== VOCABULARY_STUB_MODULE) loadNextQuestion();
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

  const handleContinue = () => {
    if (questionCount >= 20) {
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
      addSessionSummary(summary);
      navigate(resultsPath, { state: { summary } });
      return;
    }
    setPhase('question');
    loadNextQuestion();
  };

  if (contentModule === VOCABULARY_STUB_MODULE) {
    const backPath = classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home';
    return (
      <VocabularyStubPractice
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home')}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <span className="text-white font-bold">🎯 Practice</span>
          </div>
          <div className="flex items-center gap-3">
            <StreakDisplay streak={streak} />
            <ScorePill score={score} icon="⭐" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>
            Question {questionCount + 1} of 20
          </span>
          <span>{correctCount} correct</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${(questionCount / 20) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <QuestionCard question={question} showHelper={settings.showHelperWords} />

        {phase === 'question' && (
          <div className="grid grid-cols-2 gap-3">
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
            explanation={question.template.explanation}
            onContinue={handleContinue}
            responseMs={events[events.length - 1]?.responseMs}
          />
        )}
      </div>
    </div>
  );
}
