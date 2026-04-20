import { supabase, isSupabaseConfigured } from './supabase';
import type { MasteryRecord, SessionSummary } from '../types';
import type { AppSettings } from './storage';
import { masteryStorageKey, normalizeMasteryRecord } from './masteryKeys';

export async function cloudLoadMasteryRecords(userId: string): Promise<Record<string, MasteryRecord>> {
  const { data, error } = await supabase
    .from('mastery_records')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return {};

  const records: Record<string, MasteryRecord> = {};
  for (const row of data) {
    const unitId = row.unit_id as string;
    const rec: MasteryRecord = {
      formKey: row.form_key,
      unitId,
      contentModule: row.content_module ?? 'russian_declension',
      attempts: row.attempts,
      correct: row.correct,
      lastSeenAt: row.last_seen_at,
      lastCorrectAt: row.last_correct_at ?? undefined,
      easeScore: row.ease_score,
      masteryScore: row.mastery_score,
      consecutiveCorrect: row.consecutive_correct,
      consecutiveWrong: row.consecutive_wrong,
      confusionWith: row.confusion_with ?? [],
      status: row.status,
    };
    const n = normalizeMasteryRecord(rec);
    records[masteryStorageKey(n.unitId, n.formKey)] = n;
  }
  return records;
}

export async function cloudSaveMasteryRecord(userId: string, record: MasteryRecord): Promise<void> {
  const n = normalizeMasteryRecord(record);
  const { error } = await supabase.from('mastery_records').upsert({
    user_id: userId,
    unit_id: n.unitId,
    content_module: n.contentModule ?? 'russian_declension',
    form_key: n.formKey,
    attempts: n.attempts,
    correct: n.correct,
    last_seen_at: n.lastSeenAt,
    last_correct_at: n.lastCorrectAt ?? null,
    ease_score: n.easeScore,
    mastery_score: n.masteryScore,
    consecutive_correct: n.consecutiveCorrect,
    consecutive_wrong: n.consecutiveWrong,
    confusion_with: n.confusionWith,
    status: n.status,
  }, { onConflict: 'user_id,unit_id,form_key' });
  if (error) throw new Error(error.message);
}

export async function cloudLoadSettings(userId: string): Promise<Partial<AppSettings>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return {};

  const row = data as Record<string, unknown>;
  return {
    audioEnabled: row.audio_enabled as boolean,
    difficulty: row.difficulty as AppSettings['difficulty'],
    showHelperWords: row.show_helper_words as boolean,
    showEnglishGloss: row.show_english_gloss as boolean,
    activeCategories: row.active_categories as AppSettings['activeCategories'],
    streakCurrent: typeof row.streak_current === 'number' ? row.streak_current : undefined,
    streakBest: typeof row.streak_best === 'number' ? row.streak_best : undefined,
    lastStreakActivityDate: (row.last_streak_activity_date as string | null) ?? undefined,
    sessionGoalType: (row.session_goal_type as AppSettings['sessionGoalType']) ?? undefined,
    sessionGoalMinutes: typeof row.session_goal_minutes === 'number' ? row.session_goal_minutes : undefined,
    sessionGoalForms: typeof row.session_goal_forms === 'number' ? row.session_goal_forms : undefined,
    uiLocale: (row.ui_locale as AppSettings['uiLocale']) ?? undefined,
  };
}

export async function cloudSaveSettings(userId: string, settings: AppSettings): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    audio_enabled: settings.audioEnabled,
    difficulty: settings.difficulty,
    show_helper_words: settings.showHelperWords,
    show_english_gloss: settings.showEnglishGloss,
    active_categories: settings.activeCategories,
    streak_current: settings.streakCurrent,
    streak_best: settings.streakBest,
    last_streak_activity_date: settings.lastStreakActivityDate,
    session_goal_type: settings.sessionGoalType,
    session_goal_minutes: settings.sessionGoalMinutes,
    session_goal_forms: settings.sessionGoalForms,
    ui_locale: settings.uiLocale,
  });
  if (error) throw new Error(error.message);
}

export async function cloudLoadSessionHistory(userId: string): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('session_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    modeId: row.mode_id,
    unitId: row.unit_id ?? undefined,
    topicId: row.topic_id ?? undefined,
    score: row.score,
    accuracy: row.accuracy,
    averageResponseMs: row.average_response_ms,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    bestStreak: row.best_streak,
    weakForms: row.weak_forms ?? [],
    confusionPairsHit: row.confusion_pairs_hit ?? [],
    completedAt: row.completed_at,
    categories: row.categories ?? [],
  }));
}

export async function cloudAppendSessionSummary(userId: string, summary: SessionSummary): Promise<void> {
  // DB columns are integer; client averages (e.g. speed round) can be floats — round before insert.
  const { error } = await supabase.from('session_summaries').insert({
    user_id: userId,
    mode_id: summary.modeId,
    unit_id: summary.unitId ?? null,
    topic_id: summary.topicId ?? null,
    score: Math.round(summary.score),
    accuracy: summary.accuracy,
    average_response_ms: Math.round(summary.averageResponseMs ?? 0),
    total_questions: Math.round(summary.totalQuestions),
    correct_answers: Math.round(summary.correctAnswers),
    best_streak: Math.round(summary.bestStreak),
    weak_forms: summary.weakForms,
    confusion_pairs_hit: summary.confusionPairsHit,
    completed_at: summary.completedAt,
    categories: summary.categories ?? [],
  });
  if (error) throw new Error(error.message);
}

/** Deletes all synced practice progress for this user (mastery + session history). RLS: own rows only. */
export async function cloudClearUserProgress(userId: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: null };

  const { error: e1 } = await supabase.from('mastery_records').delete().eq('user_id', userId);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase.from('session_summaries').delete().eq('user_id', userId);
  if (e2) return { error: e2.message };

  return { error: null };
}

export async function migrateLocalToCloud(
  userId: string,
  masteryRecords: Record<string, MasteryRecord>,
  sessionHistory: SessionSummary[],
  settings: AppSettings
): Promise<void> {
  const records = Object.values(masteryRecords);
  if (records.length > 0) {
    const rows = records.map(r => {
      const n = normalizeMasteryRecord(r);
      return {
        user_id: userId,
        unit_id: n.unitId,
        content_module: n.contentModule ?? 'russian_declension',
        form_key: n.formKey,
        attempts: n.attempts,
        correct: n.correct,
        last_seen_at: n.lastSeenAt,
        last_correct_at: n.lastCorrectAt ?? null,
        ease_score: n.easeScore,
        mastery_score: n.masteryScore,
        consecutive_correct: n.consecutiveCorrect,
        consecutive_wrong: n.consecutiveWrong,
        confusion_with: n.confusionWith,
        status: n.status,
      };
    });

    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from('mastery_records').upsert(rows.slice(i, i + 50), {
        onConflict: 'user_id,unit_id,form_key',
      });
    }
  }

  if (sessionHistory.length > 0) {
    const sessRows = sessionHistory.map(s => ({
      user_id: userId,
      mode_id: s.modeId,
      unit_id: s.unitId ?? null,
      topic_id: s.topicId ?? null,
      score: Math.round(s.score),
      accuracy: s.accuracy,
      average_response_ms: Math.round(s.averageResponseMs ?? 0),
      total_questions: Math.round(s.totalQuestions),
      correct_answers: Math.round(s.correctAnswers),
      best_streak: Math.round(s.bestStreak),
      weak_forms: s.weakForms,
      confusion_pairs_hit: s.confusionPairsHit,
      completed_at: s.completedAt,
      categories: s.categories ?? [],
    }));

    for (let i = 0; i < sessRows.length; i += 50) {
      await supabase.from('session_summaries').insert(sessRows.slice(i, i + 50));
    }
  }

  await cloudSaveSettings(userId, settings);
}
