import type { BossBattleConfig, GridChallengeConfig } from '../types';

export const defaultBossBattleConfig: BossBattleConfig = {
  startingHp: 120,
  damageBase: 12,
  damageStreakBonusPerStep: 3,
  damageFastBonus: 4,
  healOnWrong: 6,
  shieldEveryRounds: 5,
  shieldBase: 8,
  weaknessCaseId: undefined,
  maxRounds: 15,
};

export const defaultGridChallengeConfig: GridChallengeConfig = {
  caseIds: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'],
  lemmaIds: ['ya', 'ty', 'on', 'ona', 'ono', 'my', 'vy', 'oni'],
  cellMode: 'full_grid',
  timerSeconds: 300,
  hintsAllowed: 3,
  instantCheck: true,
  instantCheckFeedbackStyle: 'immediate_color',
};

export const SPEED_ROUND_DURATION_SECONDS = 60;
export const SPEED_ROUND_WRONG_PENALTY_SECONDS = 2;
export const SPEED_ROUND_FAST_THRESHOLD_MS = 3500;

export const ADAPTIVE_FAST_THRESHOLD_MS = 3500;
export const ADAPTIVE_SLOW_THRESHOLD_MS = 7000;
export const ADAPTIVE_QUEUE_MAX_SIZE = 20;
export const ADAPTIVE_PRIORITY_THRESHOLD = 40;

export const MEMORY_MATCH_FLIP_DURATION_MS = 1000;
export const MEMORY_MATCH_FAST_MATCH_THRESHOLD_MS = 3000;

/** Number of questions per focused drill round (one category × case combination). */
export const FOCUSED_ROUND_QUESTIONS = 8;
