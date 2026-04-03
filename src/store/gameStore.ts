import { create } from 'zustand';
import type { MasteryRecord, AdaptiveReviewQueueItem, SessionSummary, ModeId, DifficultyId, WordCategory } from '../types';
import { masteryStorageKey, normalizeMasteryRecord } from '../lib/masteryKeys';
import {
  loadMasteryRecords,
  saveMasteryRecords,
  loadAdaptiveQueue,
  saveAdaptiveQueue,
  loadSettings,
  saveSettings,
  loadSessionHistory,
  appendSessionSummary,
  checkAndMigrateSchema,
  type AppSettings,
} from '../lib/storage';
import { enqueueStaleReviews } from '../lib/adaptiveEngine';
import {
  cloudLoadMasteryRecords,
  cloudSaveMasteryRecord,
  cloudLoadSettings,
  cloudSaveSettings,
  cloudLoadSessionHistory,
  cloudAppendSessionSummary,
  migrateLocalToCloud,
} from '../lib/cloudStorage';
import { runCloudWriteWithRetry } from '../lib/syncNotifications';

const MIGRATED_KEY = 'cd_cloud_migrated';

interface GameStore {
  userId: string | null;
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  masteryRecords: Record<string, MasteryRecord>;
  updateMasteryRecord: (record: MasteryRecord) => void;

  adaptiveQueue: AdaptiveReviewQueueItem[];
  setAdaptiveQueue: (queue: AdaptiveReviewQueueItem[]) => void;

  sessionHistory: SessionSummary[];
  addSessionSummary: (summary: SessionSummary, opts?: { syncToCloud?: boolean }) => void;

  currentMode: ModeId | null;
  currentDifficulty: DifficultyId;
  setCurrentMode: (mode: ModeId | null) => void;
  setCurrentDifficulty: (d: DifficultyId) => void;

  toggleCategory: (cat: WordCategory) => void;

  init: () => void;
  initForUser: (userId: string) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  userId: null,
  settings: loadSettings(),
  masteryRecords: loadMasteryRecords(),
  adaptiveQueue: loadAdaptiveQueue(),
  sessionHistory: loadSessionHistory(),
  currentMode: null,
  currentDifficulty: 'standard',

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    saveSettings(updated);
    set({ settings: updated });
    const uid = get().userId;
    if (uid) void runCloudWriteWithRetry('settings', () => cloudSaveSettings(uid, updated));
  },

  updateMasteryRecord: (record) => {
    const n = normalizeMasteryRecord(record);
    const key = masteryStorageKey(n.unitId, n.formKey);
    const updated = { ...get().masteryRecords, [key]: n };
    saveMasteryRecords(updated);
    set({ masteryRecords: updated });
    const uid = get().userId;
    if (uid) void runCloudWriteWithRetry('progress', () => cloudSaveMasteryRecord(uid, record));
  },

  setAdaptiveQueue: (queue) => {
    saveAdaptiveQueue(queue);
    set({ adaptiveQueue: queue });
  },

  addSessionSummary: (summary, opts) => {
    appendSessionSummary(summary);
    set({ sessionHistory: [summary, ...get().sessionHistory].slice(0, 50) });
    const sync = opts?.syncToCloud !== false;
    const uid = get().userId;
    if (sync && uid) void runCloudWriteWithRetry('session', () => cloudAppendSessionSummary(uid, summary));
  },

  setCurrentMode: (mode) => set({ currentMode: mode }),
  setCurrentDifficulty: (d) => set({ currentDifficulty: d }),

  toggleCategory: (cat) => {
    const current = get().settings.activeCategories;
    let updated: WordCategory[];
    if (current.includes(cat)) {
      updated = current.filter(c => c !== cat);
      if (updated.length === 0) updated = [cat];
    } else {
      updated = [...current, cat];
    }
    const newSettings = { ...get().settings, activeCategories: updated };
    saveSettings(newSettings);
    set({ settings: newSettings });
    const uid = get().userId;
    if (uid) void runCloudWriteWithRetry('settings', () => cloudSaveSettings(uid, newSettings));
  },

  init: () => {
    checkAndMigrateSchema();
    const mastery = loadMasteryRecords();
    const queue = loadAdaptiveQueue();
    const updatedQueue = enqueueStaleReviews(queue, mastery);
    saveAdaptiveQueue(updatedQueue);
    set({
      settings: loadSettings(),
      masteryRecords: mastery,
      adaptiveQueue: updatedQueue,
      sessionHistory: loadSessionHistory(),
    });
  },

  initForUser: async (userId: string) => {
    set({ userId });

    const migrated = localStorage.getItem(MIGRATED_KEY);
    if (!migrated) {
      const localMastery = loadMasteryRecords();
      const localHistory = loadSessionHistory();
      const localSettings = loadSettings();
      const hasLocalData = Object.keys(localMastery).length > 0 || localHistory.length > 0;
      if (hasLocalData) {
        await migrateLocalToCloud(userId, localMastery, localHistory, localSettings);
      }
      localStorage.setItem(MIGRATED_KEY, userId);
    }

    const [cloudMastery, cloudSettingsPartial, cloudHistory] = await Promise.all([
      cloudLoadMasteryRecords(userId),
      cloudLoadSettings(userId),
      cloudLoadSessionHistory(userId),
    ]);

    const localSettings = loadSettings();
    const mergedSettings: AppSettings = { ...localSettings, ...cloudSettingsPartial };

    saveMasteryRecords(cloudMastery);
    saveSettings(mergedSettings);

    const queue = loadAdaptiveQueue();
    const updatedQueue = enqueueStaleReviews(queue, cloudMastery);
    saveAdaptiveQueue(updatedQueue);

    set({
      settings: mergedSettings,
      masteryRecords: cloudMastery,
      adaptiveQueue: updatedQueue,
      sessionHistory: cloudHistory,
    });
  },
}));
