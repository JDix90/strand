import type { MasteryRecord, AdaptiveReviewQueueItem, SessionSummary, WordCategory } from '../types';
import { DEFAULT_RUSSIAN_UNIT_ID } from './curriculumConstants';
import { masteryStorageKey, normalizeMasteryRecord } from './masteryKeys';

const KEYS = {
  MASTERY: 'cd_mastery_records',
  QUEUE: 'cd_adaptive_queue',
  SETTINGS: 'cd_settings',
  HISTORY: 'cd_session_history',
  VERSION: 'cd_schema_version',
} as const;

const CURRENT_VERSION = 3;
const MAX_HISTORY = 50;
const MAX_QUEUE = 50;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded
  }
}

export function checkAndMigrateSchema(): void {
  let version = safeGet<number>(KEYS.VERSION, 1);
  if (version < 2) {
    const settings = safeGet<Record<string, unknown>>(KEYS.SETTINGS, {});
    if (!settings.activeCategories) {
      settings.activeCategories = ['pronoun'];
      safeSet(KEYS.SETTINGS, settings);
    }
    version = 2;
    safeSet(KEYS.VERSION, version);
  }
  if (version < 3) {
    const masteryArr = safeGet<MasteryRecord[]>(KEYS.MASTERY, []);
    const migratedMastery = masteryArr.map(r =>
      normalizeMasteryRecord({
        ...r,
        unitId: r.unitId ?? DEFAULT_RUSSIAN_UNIT_ID,
        contentModule: r.contentModule ?? 'russian_declension',
      })
    );
    safeSet(KEYS.MASTERY, migratedMastery);

    const queue = safeGet<AdaptiveReviewQueueItem[]>(KEYS.QUEUE, []);
    const migratedQueue = queue.map(q => ({
      ...q,
      unitId: q.unitId ?? DEFAULT_RUSSIAN_UNIT_ID,
    }));
    safeSet(KEYS.QUEUE, migratedQueue);

    safeSet(KEYS.VERSION, CURRENT_VERSION);
  }
}

// ─── Mastery Records ──────────────────────────────────────────────────────────

export function loadMasteryRecords(): Record<string, MasteryRecord> {
  const arr = safeGet<MasteryRecord[]>(KEYS.MASTERY, []);
  return Object.fromEntries(
    arr.map(r => {
      const n = normalizeMasteryRecord(r);
      return [masteryStorageKey(n.unitId, n.formKey), n] as const;
    })
  );
}

export function saveMasteryRecords(records: Record<string, MasteryRecord>): void {
  safeSet(KEYS.MASTERY, Object.values(records));
}

// ─── Adaptive Queue ───────────────────────────────────────────────────────────

export function loadAdaptiveQueue(): AdaptiveReviewQueueItem[] {
  const arr = safeGet<AdaptiveReviewQueueItem[]>(KEYS.QUEUE, []);
  return arr.slice(0, MAX_QUEUE);
}

export function saveAdaptiveQueue(queue: AdaptiveReviewQueueItem[]): void {
  const pruned = [...queue]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_QUEUE);
  safeSet(KEYS.QUEUE, pruned);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  audioEnabled: boolean;
  difficulty: 'beginner' | 'standard' | 'advanced';
  showHelperWords: boolean;
  showEnglishGloss: boolean;
  activeCategories: WordCategory[];
}

export const defaultSettings: AppSettings = {
  audioEnabled: false,
  difficulty: 'standard',
  showHelperWords: true,
  showEnglishGloss: true,
  activeCategories: ['pronoun'],
};

export function loadSettings(): AppSettings {
  const stored = safeGet<Partial<AppSettings>>(KEYS.SETTINGS, {});
  return { ...defaultSettings, ...stored };
}

export function saveSettings(settings: AppSettings): void {
  safeSet(KEYS.SETTINGS, settings);
}

// ─── Session History ──────────────────────────────────────────────────────────

export function loadSessionHistory(): SessionSummary[] {
  return safeGet<SessionSummary[]>(KEYS.HISTORY, []);
}

export function appendSessionSummary(summary: SessionSummary): void {
  const history = loadSessionHistory();
  const updated = [summary, ...history].slice(0, MAX_HISTORY);
  safeSet(KEYS.HISTORY, updated);
}

export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
