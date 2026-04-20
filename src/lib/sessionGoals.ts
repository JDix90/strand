import type { AppSettings } from './storage';

/** When `VITE_E2E=true`, practice sessions cap at 1 question so Playwright can reach results quickly. */
function e2ePracticeQuestionCap(): number | null {
  if (import.meta.env.VITE_E2E === 'true' || import.meta.env.VITE_E2E === '1') {
    return 1;
  }
  return null;
}

/** Max questions for this practice session (default 20). */
export function practiceSessionQuestionCap(settings: AppSettings): number {
  const e2e = e2ePracticeQuestionCap();
  if (e2e != null) return e2e;
  if (settings.sessionGoalType === 'forms' && settings.sessionGoalForms && settings.sessionGoalForms > 0) {
    return Math.min(100, Math.max(1, settings.sessionGoalForms));
  }
  return 20;
}

/** Target duration in ms, or null if no time goal. */
export function practiceTimeGoalMs(settings: AppSettings): number | null {
  if (settings.sessionGoalType === 'time' && settings.sessionGoalMinutes && settings.sessionGoalMinutes > 0) {
    return settings.sessionGoalMinutes * 60 * 1000;
  }
  return null;
}
