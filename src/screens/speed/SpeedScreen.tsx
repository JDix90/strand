import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { masteryStorageKey, filterMasteryRecordsByUnit } from '../../lib/masteryKeys';
import { generateQuestion, type GeneratedQuestion } from '../../lib/questionGenerator';
import { createMasteryRecord, updateMasteryRecord, enqueueFromEvent } from '../../lib/adaptiveEngine';
import { AnswerButton } from '../../components/ui/AnswerButton';
import { TimerDisplay } from '../../components/ui/TimerDisplay';
import { StreakDisplay } from '../../components/ui/StreakDisplay';
import type { SessionAnswerEvent, SessionSummary } from '../../types';
import { SPEED_ROUND_DURATION_SECONDS, SPEED_ROUND_WRONG_PENALTY_SECONDS } from '../../data/gameConfigs';

type Phase = 'countdown' | 'playing' | 'complete';

export function SpeedScreen() {
  const navigate = useNavigate();
  const { settings, masteryRecords, adaptiveQueue, updateMasteryRecord: storeMastery, setAdaptiveQueue, addSessionSummary } = useGameStore();
  const { effectiveCategories, filterCaseIds, topicId } = useCurriculum();
  const unitId = useEffectiveUnitId();

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(SPEED_ROUND_DURATION_SECONDS);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [answerState, setAnswerState] = useState<('default' | 'correct' | 'wrong' | 'disabled')[]>(['default', 'default', 'default', 'default']);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [events, setEvents] = useState<SessionAnswerEvent[]>([]);
  const [localQueue, setLocalQueue] = useState(adaptiveQueue);
  const [localMastery, setLocalMastery] = useState(() => filterMasteryRecordsByUnit(masteryRecords, unitId));
  const presentedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedIds = useRef<string[]>([]);
  const timeLeftRef = useRef(SPEED_ROUND_DURATION_SECONDS);
  const phaseRef = useRef<Phase>('countdown');

  const categories = effectiveCategories;

  useEffect(() => {
    setLocalMastery(filterMasteryRecordsByUnit(masteryRecords, unitId));
  }, [masteryRecords, unitId]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  const loadNextQuestion = useCallback(() => {
    const q = generateQuestion(
      'speed_round',
      settings.difficulty,
      filterCaseIds,
      usedIds.current.slice(-8),
      undefined,
      categories
    );
    if (q) {
      usedIds.current = [...usedIds.current, q.template.id].slice(-20);
      setQuestion(q);
      setAnswerState(['default', 'default', 'default', 'default']);
      presentedAtRef.current = Date.now();
    }
  }, [settings.difficulty, categories, filterCaseIds]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      loadNextQuestion();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, loadNextQuestion]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('complete');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const handleAnswer = (choice: string, idx: number) => {
    if (phase !== 'playing' || !question) return;

    const answeredAt = Date.now(); // eslint-disable-line react-hooks/purity
    const responseMs = answeredAt - presentedAtRef.current;
    const isCorrect = choice === question.template.correctAnswer ||
      (question.template.acceptedAnswers?.includes(choice) ?? false);

    const newStates: ('default' | 'correct' | 'wrong' | 'disabled')[] = question.choices.map((c, i) => {
      if (c === question.template.correctAnswer) return 'correct';
      if (i === idx && !isCorrect) return 'wrong';
      return 'disabled';
    });
    setAnswerState(newStates);

    if (isCorrect) {
      const newStreak = streak + 1;
      const speedBonus = responseMs <= 3500 ? 20 : 0;
      setScore(s => s + 100 + speedBonus);
      setStreak(newStreak);
      setBestStreak(bs => Math.max(bs, newStreak));
      setCorrectCount(c => c + 1);
    } else {
      setStreak(0);
      setTimeLeft(t => Math.max(0, t - SPEED_ROUND_WRONG_PENALTY_SECONDS));
    }
    setTotalAnswered(c => c + 1);

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
      modeId: 'speed_round',
      usedHint: false,
    };
    setEvents(ev => [...ev, event]);

    const sk = masteryStorageKey(unitId, formKey);
    const existing = localMastery[sk] ?? createMasteryRecord(formKey, unitId);
    const updated = updateMasteryRecord(existing, event);
    const newMastery = { ...localMastery, [sk]: updated };
    setLocalMastery(newMastery);
    storeMastery(updated);

    const newQueue = enqueueFromEvent(localQueue, event, updated);
    setLocalQueue(newQueue);
    setAdaptiveQueue(newQueue);

    setTimeout(() => {
      if (timeLeftRef.current > 0 && phaseRef.current === 'playing') loadNextQuestion();
    }, 400);
  };

  useEffect(() => {
    if (phase !== 'complete') return;
    const summary: SessionSummary = {
      id: Date.now().toString(),
      modeId: 'speed_round',
      unitId,
      topicId: topicId ?? undefined,
      score,
      accuracy: totalAnswered > 0 ? correctCount / totalAnswered : 0,
      averageResponseMs: events.length > 0 ? events.reduce((s, e) => s + e.responseMs, 0) / events.length : 0,
      totalQuestions: totalAnswered,
      correctAnswers: correctCount,
      bestStreak,
      weakForms: [],
      confusionPairsHit: [],
      completedAt: new Date().toISOString(),
      categories,
    };
    addSessionSummary(summary);
  }, [phase, score, totalAnswered, correctCount, events, bestStreak, categories, addSessionSummary, unitId, topicId]);

  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <h1 className="text-white text-2xl font-bold">⚡ Speed Round</h1>
        <div className="text-8xl font-bold text-yellow-400 animate-pulse">{countdown}</div>
        <p className="text-slate-400">Get ready!</p>
      </div>
    );
  }

  if (phase === 'complete') {
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">⚡</div>
          <h1 className="text-3xl font-bold text-white">Time's Up!</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-sm space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-yellow-400">{score.toLocaleString()}</p>
            <p className="text-slate-400 text-sm mt-1">Final Score</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-white">{totalAnswered}</p>
              <p className="text-slate-500 text-xs">Answered</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">{accuracy}%</p>
              <p className="text-slate-500 text-xs">Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-bold text-orange-400">{bestStreak}</p>
              <p className="text-slate-500 text-xs">Best Streak</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors">
            Home
          </button>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors">
            Play Again
          </button>
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
            <span className="text-white font-bold">⚡ Speed Round</span>
          </div>
          <div className="flex items-center gap-3">
            <StreakDisplay streak={streak} />
            <TimerDisplay
              seconds={timeLeft}
              warning={timeLeft <= 15}
              danger={timeLeft <= 5}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Score: <span className="text-white font-bold">{score.toLocaleString()}</span></span>
          <span>{correctCount}/{totalAnswered} correct</span>
        </div>

        {question && (
          <>
            <div className="bg-slate-800 rounded-2xl border border-slate-600 p-6 text-center">
              <p className="text-3xl font-bold text-white">{question.template.prompt}</p>
              {settings.showHelperWords && (
                <p className="text-slate-400 text-sm mt-2">Helper: {question.template.helperWord}</p>
              )}
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}
