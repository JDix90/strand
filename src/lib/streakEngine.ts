import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

/** yyyy-MM-dd in the user's local calendar for an ISO timestamp. */
export function localCalendarDateFromISO(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocalISODate(): string {
  return localCalendarDateFromISO(new Date().toISOString());
}

/**
 * Updates streak when a qualifying session completes on `sessionLocalDate` (yyyy-MM-dd).
 * Same calendar day as last activity: streak unchanged (at most one increment per day).
 */
export function nextStreakState(
  lastActivityDate: string | null,
  sessionLocalDate: string,
  current: number,
  best: number,
): { current: number; best: number; lastActivityDate: string } {
  if (lastActivityDate === sessionLocalDate) {
    return { current, best, lastActivityDate: sessionLocalDate };
  }

  if (!lastActivityDate) {
    const nc = 1;
    return { current: nc, best: Math.max(best, nc), lastActivityDate: sessionLocalDate };
  }

  const dLast = startOfDay(parseISO(`${lastActivityDate}T12:00:00`));
  const dSess = startOfDay(parseISO(`${sessionLocalDate}T12:00:00`));
  const diff = differenceInCalendarDays(dSess, dLast);

  if (diff === 1) {
    const nc = current + 1;
    return { current: nc, best: Math.max(best, nc), lastActivityDate: sessionLocalDate };
  }
  if (diff > 1) {
    return { current: 1, best, lastActivityDate: sessionLocalDate };
  }

  return { current: 1, best: Math.max(best, 1), lastActivityDate: sessionLocalDate };
}

/** Modes that count toward daily streaks (exclude passive / tutorial-only). */
export const STREAK_QUALIFYING_MODE_IDS = new Set([
  'practice',
  'speed_round',
  'grid_challenge',
  'memory_match',
  'boss_battle',
]);

export function modeQualifiesForStreak(modeId: string): boolean {
  return STREAK_QUALIFYING_MODE_IDS.has(modeId);
}
