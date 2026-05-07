import type { MasteryRecord, AdaptiveReviewQueueItem, SessionSummary, WordCategory } from '../types';
import { masteryStorageKey, normalizeMasteryRecord } from './masteryKeys';
import { markPerfEnd, markPerfStart, recordMetric, reportError } from './observability';

const KEYS = {
  MASTERY: 'cd_mastery_records',
  QUEUE: 'cd_adaptive_queue',
  SETTINGS: 'cd_settings',
  HISTORY: 'cd_session_history',
} as const;

const MAX_HISTORY = 50;
const MAX_QUEUE = 50;
const WRITE_DEBOUNCE_MS = 120;
const STORAGE_VERSION = 1;
const pendingWrites = new Map<string, unknown>();
let pendingFlushTimer: number | null = null;
let flushHandlersInstalled = false;

interface StorageEnvelope<T> {
  version: number;
  data: T;
}

function safeGet<T>(key: string, fallback: T): T {
  if (pendingWrites.has(key)) {
    return pendingWrites.get(key) as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function unwrapVersioned<T>(raw: unknown, fallback: T): T {
  if (
    raw &&
    typeof raw === 'object' &&
    'version' in raw &&
    'data' in raw &&
    typeof (raw as { version: unknown }).version === 'number'
  ) {
    return (raw as StorageEnvelope<T>).data;
  }
  if (raw === undefined || raw === null) return fallback;
  return raw as T;
}

function readVersioned<T>(key: string, fallback: T): T {
  const raw = safeGet<unknown>(key, null);
  return unwrapVersioned(raw, fallback);
}

function writeVersioned<T>(key: string, value: T): void {
  safeSet(key, { version: STORAGE_VERSION, data: value } satisfies StorageEnvelope<T>);
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      reportError('storage_write', 'localStorage unavailable in non-window context');
    }
    return;
  }
  pendingWrites.set(key, value);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (typeof window === 'undefined') return;
  ensureFlushHandlers();
  if (pendingFlushTimer != null) window.clearTimeout(pendingFlushTimer);
  pendingFlushTimer = window.setTimeout(() => {
    flushPendingWrites();
  }, WRITE_DEBOUNCE_MS);
}

function ensureFlushHandlers(): void {
  if (flushHandlersInstalled || typeof window === 'undefined') return;
  flushHandlersInstalled = true;
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingWrites();
  });
  window.addEventListener('beforeunload', () => {
    flushPendingWrites();
  });
}

export function flushPendingWrites(): void {
  if (pendingFlushTimer != null && typeof window !== 'undefined') {
    window.clearTimeout(pendingFlushTimer);
    pendingFlushTimer = null;
  }
  if (pendingWrites.size === 0) return;
  markPerfStart('storage_flush');
  recordMetric('storage_flush_batch_size', pendingWrites.size);
  try {
    for (const [key, value] of pendingWrites.entries()) {
      const payload = JSON.stringify(value);
      recordMetric('storage_write_bytes', payload.length);
      localStorage.setItem(key, payload);
    }
    pendingWrites.clear();
  } catch {
    reportError('storage_write', 'Failed to write pending localStorage values');
  } finally {
    markPerfEnd('storage_flush');
  }
}

// ─── Mastery Records ──────────────────────────────────────────────────────────

export function loadMasteryRecords(): Record<string, MasteryRecord> {
  const arr = readVersioned<MasteryRecord[]>(KEYS.MASTERY, []);
  return Object.fromEntries(
    arr.map(r => {
      const n = normalizeMasteryRecord(r);
      return [masteryStorageKey(n.formKey), n] as const;
    })
  );
}

export function saveMasteryRecords(records: Record<string, MasteryRecord>): void {
  writeVersioned(KEYS.MASTERY, Object.values(records));
}

// ─── Adaptive Queue ───────────────────────────────────────────────────────────

export function loadAdaptiveQueue(): AdaptiveReviewQueueItem[] {
  const arr = readVersioned<AdaptiveReviewQueueItem[]>(KEYS.QUEUE, []);
  return arr.slice(0, MAX_QUEUE);
}

export function saveAdaptiveQueue(queue: AdaptiveReviewQueueItem[]): void {
  const pruned = [...queue]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_QUEUE);
  writeVersioned(KEYS.QUEUE, pruned);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type SessionGoalType = 'none' | 'time' | 'forms';
export type UiLocale = 'en' | 'ru';

export interface AppSettings {
  audioEnabled: boolean;
  difficulty: 'beginner' | 'standard' | 'advanced';
  showHelperWords: boolean;
  showEnglishGloss: boolean;
  activeCategories: WordCategory[];
  /** Daily streak (qualifying sessions). */
  streakCurrent: number;
  streakBest: number;
  /** yyyy-MM-dd local date of last streak-counted session, or null. */
  lastStreakActivityDate: string | null;
  sessionGoalType: SessionGoalType;
  /** Target minutes when sessionGoalType === 'time' (e.g. 5, 10, 15). */
  sessionGoalMinutes: number | null;
  /** Target answered questions when sessionGoalType === 'forms'. */
  sessionGoalForms: number | null;
  /** UI language for chrome only (not learning prompts). */
  uiLocale: UiLocale;
}

export const defaultSettings: AppSettings = {
  audioEnabled: false,
  difficulty: 'standard',
  showHelperWords: true,
  showEnglishGloss: true,
  activeCategories: ['pronoun'],
  streakCurrent: 0,
  streakBest: 0,
  lastStreakActivityDate: null,
  sessionGoalType: 'none',
  sessionGoalMinutes: null,
  sessionGoalForms: null,
  uiLocale: 'en',
};

export function loadSettings(): AppSettings {
  const stored = readVersioned<Partial<AppSettings>>(KEYS.SETTINGS, {});
  return { ...defaultSettings, ...stored };
}

export function saveSettings(settings: AppSettings): void {
  writeVersioned(KEYS.SETTINGS, settings);
}

// ─── Session History ──────────────────────────────────────────────────────────

export function loadSessionHistory(): SessionSummary[] {
  return readVersioned<SessionSummary[]>(KEYS.HISTORY, []);
}

export function appendSessionSummary(summary: SessionSummary): void {
  const history = loadSessionHistory();
  const updated = [summary, ...history].slice(0, MAX_HISTORY);
  writeVersioned(KEYS.HISTORY, updated);
}

export function clearAllData(): void {
  flushPendingWrites();
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
