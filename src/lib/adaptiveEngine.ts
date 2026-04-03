import type {
  MasteryRecord,
  AdaptiveReviewQueueItem,
  SessionAnswerEvent,
  WordCategory,
} from '../types';
import { confusionPairs } from '../data/confusionPairs';
import { getForm } from '../data/allForms';
import {
  ADAPTIVE_FAST_THRESHOLD_MS,
  ADAPTIVE_SLOW_THRESHOLD_MS,
  ADAPTIVE_QUEUE_MAX_SIZE,
  ADAPTIVE_PRIORITY_THRESHOLD,
} from '../data/gameConfigs';
import { DEFAULT_RUSSIAN_UNIT_ID } from './curriculumConstants';
import { masteryStorageKey } from './masteryKeys';

// ─── Mastery ─────────────────────────────────────────────────────────────────

export function createMasteryRecord(
  formKey: string,
  unitId: string = DEFAULT_RUSSIAN_UNIT_ID,
  contentModule: string = 'russian_declension'
): MasteryRecord {
  return {
    formKey,
    unitId,
    contentModule,
    attempts: 0,
    correct: 0,
    lastSeenAt: new Date().toISOString(),
    easeScore: 1.0,
    masteryScore: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    confusionWith: [],
    status: 'unseen',
  };
}

export function updateMasteryRecord(
  record: MasteryRecord,
  event: SessionAnswerEvent
): MasteryRecord {
  const updated = { ...record };
  updated.attempts += 1;
  updated.lastSeenAt = new Date().toISOString();

  if (event.wasCorrect) {
    updated.correct += 1;
    updated.consecutiveCorrect += 1;
    updated.consecutiveWrong = 0;
    updated.lastCorrectAt = new Date().toISOString();

    if (event.responseMs <= ADAPTIVE_FAST_THRESHOLD_MS) {
      updated.easeScore += 0.08;
    } else if (event.responseMs <= ADAPTIVE_SLOW_THRESHOLD_MS) {
      updated.easeScore += 0.03;
    }
    // Very slow correct: no change
  } else {
    updated.consecutiveWrong += 1;
    updated.consecutiveCorrect = 0;
    updated.easeScore -= 0.12;

    // Track confusion pairs
    const cp = confusionPairs.find(
      p =>
        (p.formA === event.selectedAnswer || p.formB === event.selectedAnswer) &&
        (p.formA === event.correctAnswer || p.formB === event.correctAnswer)
    );
    if (cp && !updated.confusionWith.includes(event.selectedAnswer)) {
      updated.confusionWith = [...updated.confusionWith, event.selectedAnswer];
    }
  }

  // Clamp easeScore
  updated.easeScore = Math.min(2.5, Math.max(0.5, updated.easeScore));

  // Compute masteryScore
  const accuracy = updated.attempts > 0 ? updated.correct / updated.attempts : 0;
  const easeNormalized = (updated.easeScore - 0.5) / 2.0;
  const streakNormalized = Math.min(updated.consecutiveCorrect, 5) / 5;
  updated.masteryScore = Math.round(
    Math.min(100, Math.max(0,
      accuracy * 70 + easeNormalized * 20 + streakNormalized * 10
    ))
  );

  // Compute status
  if (updated.masteryScore <= 39) {
    updated.status = 'introduced';
  } else if (updated.masteryScore <= 54) {
    updated.status = 'shaky';
  } else if (updated.masteryScore <= 74) {
    updated.status = 'improving';
  } else if (updated.masteryScore <= 89) {
    updated.status = 'strong';
  } else if (updated.masteryScore >= 90 && updated.consecutiveCorrect >= 4) {
    updated.status = 'mastered';
  } else {
    updated.status = 'strong';
  }

  return updated;
}

// ─── Adaptive Queue ───────────────────────────────────────────────────────────

export function enqueueFromEvent(
  queue: AdaptiveReviewQueueItem[],
  event: SessionAnswerEvent,
  masteryRecord: MasteryRecord
): AdaptiveReviewQueueItem[] {
  let newQueue = [...queue];

  const uid = masteryRecord.unitId ?? DEFAULT_RUSSIAN_UNIT_ID;

  if (!event.wasCorrect) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: masteryRecord.formKey,
      unitId: uid,
      priorityScore: 100,
      scheduledAfterQuestions: 2,
      questionsSinceEnqueue: 0,
      source: 'wrong_answer',
    });

    // Check confusion pair
    const cp = confusionPairs.find(
      p =>
        (p.formA === event.selectedAnswer || p.formB === event.selectedAnswer) &&
        (p.formA === event.correctAnswer || p.formB === event.correctAnswer)
    );
    if (cp) {
      const pairedForm = cp.formA === event.correctAnswer ? cp.formB : cp.formA;
      newQueue = addOrUpdateQueueItem(newQueue, {
        formKey: pairedForm,
        unitId: uid,
        priorityScore: 40,
        scheduledAfterQuestions: 5,
        questionsSinceEnqueue: 0,
        source: 'confusion_pair',
      });
    }
  } else if (event.responseMs > ADAPTIVE_SLOW_THRESHOLD_MS) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: masteryRecord.formKey,
      unitId: uid,
      priorityScore: 50,
      scheduledAfterQuestions: 4,
      questionsSinceEnqueue: 0,
      source: 'slow_correct',
    });
  } else if (event.responseMs > ADAPTIVE_FAST_THRESHOLD_MS) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: masteryRecord.formKey,
      unitId: uid,
      priorityScore: 25,
      scheduledAfterQuestions: 6,
      questionsSinceEnqueue: 0,
      source: 'slow_correct',
    });
  }

  // Passive mastery gap
  if (masteryRecord.status === 'shaky' || masteryRecord.status === 'introduced') {
    const bonus = masteryRecord.status === 'shaky' ? 10 : 6;
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: masteryRecord.formKey,
      unitId: uid,
      priorityScore: bonus,
      scheduledAfterQuestions: 8,
      questionsSinceEnqueue: 0,
      source: 'mastery_gap',
    });
  }

  // Cap queue
  if (newQueue.length > ADAPTIVE_QUEUE_MAX_SIZE) {
    newQueue.sort((a, b) => b.priorityScore - a.priorityScore);
    newQueue = newQueue.slice(0, ADAPTIVE_QUEUE_MAX_SIZE);
  }

  return newQueue;
}

function addOrUpdateQueueItem(
  queue: AdaptiveReviewQueueItem[],
  item: AdaptiveReviewQueueItem
): AdaptiveReviewQueueItem[] {
  const existing = queue.findIndex(q => queueItemsMatch(q, item));
  if (existing >= 0) {
    const merged = { ...queue[existing] };
    merged.priorityScore += item.priorityScore;
    merged.scheduledAfterQuestions = Math.min(
      merged.scheduledAfterQuestions,
      item.scheduledAfterQuestions
    );
    const updated = [...queue];
    updated[existing] = merged;
    return updated;
  }
  return [...queue, item];
}

function queueItemsMatch(a: AdaptiveReviewQueueItem, b: AdaptiveReviewQueueItem): boolean {
  const ua = a.unitId ?? DEFAULT_RUSSIAN_UNIT_ID;
  const ub = b.unitId ?? DEFAULT_RUSSIAN_UNIT_ID;
  return ua === ub && a.formKey === b.formKey;
}

export function advanceQueue(queue: AdaptiveReviewQueueItem[]): AdaptiveReviewQueueItem[] {
  return queue.map(item => ({
    ...item,
    questionsSinceEnqueue: item.questionsSinceEnqueue + 1,
  }));
}

export function computeTimeSinceHours(lastSeenAt: string): number {
  const ms = Date.now() - new Date(lastSeenAt).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

function computeTimeDecayBonus(hours: number): number {
  if (hours <= 1) return 0;
  if (hours <= 6) return 5;
  if (hours <= 24) return 15;
  if (hours <= 72) return 30;
  if (hours <= 168) return 50;
  return 70;
}

function statusDecayMultiplier(status: MasteryRecord['status']): number {
  switch (status) {
    case 'mastered': return 0.3;
    case 'strong': return 0.5;
    case 'improving': return 0.8;
    case 'shaky': return 1.0;
    case 'introduced': return 1.2;
    default: return 0;
  }
}

export function computeEffectivePriority(
  item: AdaptiveReviewQueueItem,
  masteryRecord: MasteryRecord | undefined,
  recentFormKeys: string[],
  confusionCount: number
): number {
  let priority = item.priorityScore;

  // Recency bonus
  const lastErrorIndex = recentFormKeys.lastIndexOf(item.formKey);
  if (lastErrorIndex >= 0 && recentFormKeys.length - lastErrorIndex <= 10) {
    priority += 15;
  }

  // Mastery gap bonus
  if (masteryRecord) {
    const gapBonus =
      masteryRecord.status === 'shaky' ? 25 :
      masteryRecord.status === 'introduced' ? 15 :
      masteryRecord.status === 'improving' ? 8 : 0;
    priority += gapBonus;

    // Time-decay bonus
    if (masteryRecord.status !== 'unseen') {
      const hours = computeTimeSinceHours(masteryRecord.lastSeenAt);
      const rawBonus = computeTimeDecayBonus(hours);
      priority += Math.round(rawBonus * statusDecayMultiplier(masteryRecord.status));
    }
  }

  // Confusion bonus
  if (confusionCount >= 2) {
    priority += 20;
  }

  // Repetition penalty
  const last2 = recentFormKeys.slice(-2);
  const last5 = recentFormKeys.slice(-5);
  if (last2.includes(item.formKey)) {
    priority -= 60;
  } else if (last5.includes(item.formKey)) {
    priority -= 25;
  }

  return priority;
}

export function selectNextAdaptiveFormKey(
  queue: AdaptiveReviewQueueItem[],
  masteryRecords: Record<string, MasteryRecord>,
  recentFormKeys: string[],
  confusionCounts: Record<string, number>,
  activeCategories: WordCategory[] | undefined,
  unitId: string
): string | null {
  let eligible = queue.filter(
    item => item.questionsSinceEnqueue >= item.scheduledAfterQuestions
  );

  const uid = unitId;
  eligible = eligible.filter(item => (item.unitId ?? DEFAULT_RUSSIAN_UNIT_ID) === uid);

  if (activeCategories && activeCategories.length > 0) {
    eligible = eligible.filter(item => {
      const [lemmaId, caseId] = item.formKey.split(':');
      const form = getForm(lemmaId, caseId);
      return form ? activeCategories.includes(form.category) : false;
    });
  }

  if (eligible.length === 0) return null;

  const scored = eligible.map(item => {
    const sk = masteryStorageKey(uid, item.formKey);
    return {
      item,
      effectivePriority: computeEffectivePriority(
        item,
        masteryRecords[sk] ?? masteryRecords[item.formKey],
        recentFormKeys,
        confusionCounts[sk] ?? confusionCounts[item.formKey] ?? 0
      ),
    };
  });

  scored.sort((a, b) => b.effectivePriority - a.effectivePriority);

  if (scored[0].effectivePriority >= ADAPTIVE_PRIORITY_THRESHOLD) {
    return scored[0].item.formKey;
  }

  return null;
}

export function consumeQueueItem(
  queue: AdaptiveReviewQueueItem[],
  formKey: string,
  unitId: string = DEFAULT_RUSSIAN_UNIT_ID
): AdaptiveReviewQueueItem[] {
  return queue
    .map(item =>
      item.formKey === formKey && (item.unitId ?? DEFAULT_RUSSIAN_UNIT_ID) === unitId
        ? { ...item, priorityScore: item.priorityScore - 50 }
        : item
    )
    .filter(item => item.priorityScore > 0);
}

// ─── Grid Challenge Remediation ───────────────────────────────────────────────

export function enqueueFromGridResults(
  queue: AdaptiveReviewQueueItem[],
  incorrectFormKeys: string[],
  blankFormKeys: string[],
  editedFormKeys: string[],
  unitId: string = DEFAULT_RUSSIAN_UNIT_ID
): AdaptiveReviewQueueItem[] {
  let newQueue = [...queue];

  for (const fk of incorrectFormKeys) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: fk,
      unitId,
      priorityScore: 80,
      scheduledAfterQuestions: 2,
      questionsSinceEnqueue: 0,
      source: 'wrong_answer',
    });
  }

  for (const fk of blankFormKeys) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: fk,
      unitId,
      priorityScore: 60,
      scheduledAfterQuestions: 3,
      questionsSinceEnqueue: 0,
      source: 'wrong_answer',
    });
  }

  for (const fk of editedFormKeys) {
    newQueue = addOrUpdateQueueItem(newQueue, {
      formKey: fk,
      unitId,
      priorityScore: 25,
      scheduledAfterQuestions: 5,
      questionsSinceEnqueue: 0,
      source: 'slow_correct',
    });
  }

  return newQueue;
}

// ─── Spaced Repetition ──────────────────────────────────────────────────────

export function getStaleFormKeys(
  masteryRecords: Record<string, MasteryRecord>,
  thresholdHours: number
): string[] {
  const stale: string[] = [];
  for (const record of Object.values(masteryRecords)) {
    if (record.status === 'unseen') continue;
    const hours = computeTimeSinceHours(record.lastSeenAt);
    if (hours >= thresholdHours) {
      stale.push(record.formKey);
    }
  }
  return stale;
}

export function enqueueStaleReviews(
  queue: AdaptiveReviewQueueItem[],
  masteryRecords: Record<string, MasteryRecord>
): AdaptiveReviewQueueItem[] {
  let newQueue = [...queue];

  for (const record of Object.values(masteryRecords)) {
    if (record.status === 'unseen') continue;

    const hours = computeTimeSinceHours(record.lastSeenAt);
    let shouldEnqueue = false;
    let priority = 0;

    if (record.status === 'introduced' || record.status === 'shaky') {
      if (hours >= 24) {
        shouldEnqueue = true;
        priority = Math.min(60, 30 + Math.floor(hours / 24) * 10);
      }
    } else if (record.status === 'improving') {
      if (hours >= 48) {
        shouldEnqueue = true;
        priority = Math.min(50, 25 + Math.floor(hours / 24) * 5);
      }
    } else if (record.status === 'strong') {
      if (hours >= 72) {
        shouldEnqueue = true;
        priority = Math.min(40, 20 + Math.floor(hours / 48) * 5);
      }
    } else if (record.status === 'mastered') {
      if (hours >= 168) {
        shouldEnqueue = true;
        priority = Math.min(30, 15 + Math.floor(hours / 168) * 5);
      }
    }

    if (shouldEnqueue) {
      newQueue = addOrUpdateQueueItem(newQueue, {
        formKey: record.formKey,
        unitId: record.unitId ?? DEFAULT_RUSSIAN_UNIT_ID,
        priorityScore: priority,
        scheduledAfterQuestions: 0,
        questionsSinceEnqueue: 0,
        source: 'stale_review',
      });
    }
  }

  if (newQueue.length > ADAPTIVE_QUEUE_MAX_SIZE * 2) {
    newQueue.sort((a, b) => b.priorityScore - a.priorityScore);
    newQueue = newQueue.slice(0, ADAPTIVE_QUEUE_MAX_SIZE * 2);
  }

  return newQueue;
}

export function computeDueReviewCount(
  masteryRecords: Record<string, MasteryRecord>,
  activeCategories?: WordCategory[]
): number {
  let count = 0;
  for (const record of Object.values(masteryRecords)) {
    if (record.status === 'unseen') continue;
    if (activeCategories && activeCategories.length > 0) {
      const [lemmaId, caseId] = record.formKey.split(':');
      const form = getForm(lemmaId, caseId);
      if (!form || !activeCategories.includes(form.category)) continue;
    }
    const hours = computeTimeSinceHours(record.lastSeenAt);

    switch (record.status) {
      case 'introduced':
      case 'shaky':
        if (hours >= 24) count++;
        break;
      case 'improving':
        if (hours >= 48) count++;
        break;
      case 'strong':
        if (hours >= 72) count++;
        break;
      case 'mastered':
        if (hours >= 168) count++;
        break;
    }
  }
  return count;
}
