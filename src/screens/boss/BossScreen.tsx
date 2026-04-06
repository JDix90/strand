import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { masteryStorageKey, filterMasteryRecordsByUnit } from '../../lib/masteryKeys';
import { generateQuestion, type GeneratedQuestion } from '../../lib/questionGenerator';
import { createMasteryRecord, updateMasteryRecord, enqueueFromEvent } from '../../lib/adaptiveEngine';
import { isConfusionPair } from '../../data/confusionPairs';
import {
  createBossState, computeDamage, computeHeal, applyDamage, applyHeal,
  advanceRound, addTeamScore, incrementStreak, getMvpTeam, isWeaknessHit,
  type BossState,
} from '../../lib/bossEngine';
import { defaultBossBattleConfig } from '../../data/gameConfigs';
import { AnswerButton } from '../../components/ui/AnswerButton';
import { BossHealthBar } from '../../components/ui/BossHealthBar';
import { StreakDisplay } from '../../components/ui/StreakDisplay';
import { caseMetadata } from '../../data/caseMetadata';
import type { SessionAnswerEvent, SessionSummary, BossBattleConfig, CaseId } from '../../types';

const TEAMS = ['Team A', 'Team B', 'Team C', 'Team D'];
const BOSS_NAMES = ['Падежный Дракон', 'Граммар Горгона', 'Склонение Сфинкс'];
const BOSS_EMOJIS = ['🐉', '🦎', '🦁'];

type Phase = 'setup' | 'question' | 'feedback' | 'complete';

export function BossScreen() {
  const navigate = useNavigate();
  const { settings, masteryRecords, adaptiveQueue, updateMasteryRecord: storeMastery, setAdaptiveQueue, addSessionSummary } = useGameStore();
  const { effectiveCategories, filterCaseIds, topicId } = useCurriculum();
  const unitId = useEffectiveUnitId();

  const [phase, setPhase] = useState<Phase>('setup');
  const [teamCount, setTeamCount] = useState(2);
  const [weaknessCaseId, setWeaknessCaseId] = useState<string>('');
  const [bossState, setBossState] = useState<BossState>(createBossState(defaultBossBattleConfig));
  const [config, setConfig] = useState<BossBattleConfig>(defaultBossBattleConfig);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [answerState, setAnswerState] = useState<('default' | 'correct' | 'wrong' | 'disabled')[]>(['default', 'default', 'default', 'default']);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [lastHeal, setLastHeal] = useState<number | null>(null);
  const [events, setEvents] = useState<SessionAnswerEvent[]>([]);
  const [localQueue, setLocalQueue] = useState(adaptiveQueue);
  const [localMastery, setLocalMastery] = useState(() => filterMasteryRecordsByUnit(masteryRecords, unitId));
  const [bossName] = useState(() => BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)]);
  const [bossEmoji] = useState(() => BOSS_EMOJIS[Math.floor(Math.random() * BOSS_EMOJIS.length)]);
  const presentedAtRef = useRef<number>(0);
  const usedIds = useRef<string[]>([]);
  const bestStreakRef = useRef(0);

  const categories = effectiveCategories;

  useEffect(() => {
    setLocalMastery(filterMasteryRecordsByUnit(masteryRecords, unitId));
  }, [masteryRecords, unitId]);

  const loadNextQuestion = useCallback(() => {
    const q = generateQuestion(
      'boss_battle',
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
      setLastDamage(null);
      setLastHeal(null);
      presentedAtRef.current = Date.now();
    }
  }, [settings.difficulty, categories, filterCaseIds]);

  const handleStart = () => {
    const cfg: BossBattleConfig = { ...defaultBossBattleConfig };
    if (weaknessCaseId) cfg.weaknessCaseId = weaknessCaseId as CaseId;
    setConfig(cfg);

    const teams: Record<string, number> = {};
    for (let i = 0; i < teamCount; i++) teams[TEAMS[i]] = 0;
    const state = createBossState(cfg);
    state.teamScores = teams;
    setBossState(state);
    setPhase('question');
    loadNextQuestion();
  };

  const handleAnswer = (choice: string, idx: number) => {
    if (phase !== 'question' || !question) return;

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

    const teamId = TEAMS[currentTeamIdx];
    let newBossState = { ...bossState };

    if (isCorrect) {
      const weakHit = isWeaknessHit(question.template.targetCaseId, config.weaknessCaseId);
      const isContrast = question.template.tags.includes('contrast');
      const dmg = computeDamage(
        config,
        bossState.teamStreak,
        responseMs,
        settings.difficulty,
        weakHit,
        isContrast
      );
      setLastDamage(dmg);
      newBossState = applyDamage(incrementStreak(newBossState), dmg);
      bestStreakRef.current = Math.max(bestStreakRef.current, newBossState.teamStreak);
      let pts = 100;
      if (responseMs <= 3000) pts += 20;
      if (weakHit) pts += 20;
      newBossState = addTeamScore(newBossState, teamId, pts);
    } else {
      const cpMatch = isConfusionPair(choice, question.template.correctAnswer);
      const heal = computeHeal(config, !!cpMatch, responseMs);
      setLastHeal(heal);
      newBossState = applyHeal(newBossState, heal);
    }

    newBossState = advanceRound(newBossState, config);
    setBossState(newBossState);

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
      modeId: 'boss_battle',
      usedHint: false,
    };

    const allEvents = [...events, event];
    setEvents(allEvents);

    const sk = masteryStorageKey(unitId, formKey);
    const existing = localMastery[sk] ?? createMasteryRecord(formKey, unitId);
    const updated = updateMasteryRecord(existing, event);
    const newMastery = { ...localMastery, [sk]: updated };
    setLocalMastery(newMastery);
    storeMastery(updated);
    const newQueue = enqueueFromEvent(localQueue, event, updated);
    setLocalQueue(newQueue);
    setAdaptiveQueue(newQueue);

    if (newBossState.isDefeated || newBossState.isLost) {
      setPhase('feedback');
      setTimeout(() => {
        const summary: SessionSummary = {
          id: Date.now().toString(),
          modeId: 'boss_battle',
          unitId,
          topicId: topicId ?? undefined,
          score: Object.values(newBossState.teamScores).reduce((a, b) => a + b, 0),
          accuracy: allEvents.length > 0 ? allEvents.filter(e => e.wasCorrect).length / allEvents.length : 0,
          averageResponseMs: allEvents.length > 0 ? allEvents.reduce((s, e) => s + e.responseMs, 0) / allEvents.length : 0,
          totalQuestions: allEvents.length,
          correctAnswers: allEvents.filter(e => e.wasCorrect).length,
          bestStreak: bestStreakRef.current,
          weakForms: [],
          confusionPairsHit: [],
          completedAt: new Date().toISOString(),
          categories,
        };
        addSessionSummary(summary);
        setPhase('complete');
      }, 1500);
    } else {
      setPhase('feedback');
      setCurrentTeamIdx(i => (i + 1) % teamCount);
      setTimeout(() => {
        loadNextQuestion();
        setPhase('question');
      }, 1200);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-4 gap-8">
        <div className="text-center space-y-2">
          <div className="text-6xl">{bossEmoji}</div>
          <h1 className="text-3xl font-bold text-ink">⚔️ Boss Battle</h1>
          <p className="text-ink-secondary">Team vs. Boss — Deal damage with correct answers!</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-sm space-y-5">
          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Number of Teams</label>
            <div className="flex gap-3">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setTeamCount(n)}
                  className={`flex-1 py-2 rounded-xl font-bold transition-colors ${teamCount === n ? 'bg-red-600 text-ink' : 'bg-surface-muted text-ink-secondary hover:bg-surface-muted'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Boss Weakness (optional)</label>
            <select
              value={weaknessCaseId}
              onChange={e => setWeaknessCaseId(e.target.value)}
              className="w-full bg-surface-muted border border-border-strong text-ink rounded-xl px-3 py-2"
            >
              <option value="">No weakness</option>
              {Object.values(caseMetadata).map(m => (
                <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-ink rounded-xl font-bold text-lg transition-colors"
          >
            Start Battle!
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    const mvp = getMvpTeam(bossState);
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">{bossState.isDefeated ? '🏆' : '💀'}</div>
          <h1 className="text-3xl font-bold text-ink">
            {bossState.isDefeated ? 'Boss Defeated!' : 'Boss Wins!'}
          </h1>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-sm space-y-4">
          {mvp && <p className="text-center text-yellow-400 font-bold">🏅 MVP: {mvp}</p>}
          <div className="space-y-2">
            {Object.entries(bossState.teamScores).map(([team, pts]) => (
              <div key={team} className="flex justify-between text-sm">
                <span className="text-ink-secondary">{team}</span>
                <span className="text-ink font-bold">{pts.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
          <p className="text-ink-secondary text-sm text-center">Round {bossState.round}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="px-6 py-3 bg-surface-muted hover:bg-surface-muted text-ink rounded-xl font-semibold">Home</button>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-ink rounded-xl font-semibold">Play Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">✕</button>
            <span className="text-ink font-bold">⚔️ Boss Battle — Round {bossState.round}</span>
          </div>
          <StreakDisplay streak={bossState.teamStreak} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-surface rounded-2xl border border-red-900 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{bossEmoji}</span>
            <div className="flex-1">
              <p className="text-red-300 font-bold">{bossName}</p>
              <BossHealthBar hp={bossState.hp} maxHp={bossState.maxHp} shieldHp={bossState.shieldHp} />
            </div>
            {lastDamage !== null && (
              <div className="text-green-400 font-bold text-xl animate-bounce">-{lastDamage}</div>
            )}
            {lastHeal !== null && (
              <div className="text-red-400 font-bold text-xl animate-bounce">+{lastHeal} 💊</div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {Object.entries(bossState.teamScores).map(([team, pts], i) => (
            <div
              key={team}
              className={`flex-1 rounded-xl p-2 text-center border-2 transition-colors ${currentTeamIdx === i ? 'border-blue-400 bg-brand/15' : 'border-border bg-surface'}`}
            >
              <p className="text-xs text-ink-secondary">{team}</p>
              <p className="text-ink font-bold">{pts.toLocaleString()}</p>
              {currentTeamIdx === i && <p className="text-link text-xs">&larr; Turn</p>}
            </div>
          ))}
        </div>

        {question && (
          <>
            <div className="bg-surface rounded-2xl border border-border-strong p-6 text-center">
              <p className="text-3xl font-bold text-ink">{question.template.prompt}</p>
              {settings.showHelperWords && (
                <p className="text-ink-secondary text-sm mt-2">Helper: {question.template.helperWord}</p>
              )}
              {config.weaknessCaseId && question.template.targetCaseId === config.weaknessCaseId && (
                <p className="text-yellow-400 text-xs mt-1">⚡ Weakness hit! +3 bonus damage</p>
              )}
            </div>

            {(phase === 'question' || phase === 'feedback') && (
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
          </>
        )}
      </div>
    </div>
  );
}
