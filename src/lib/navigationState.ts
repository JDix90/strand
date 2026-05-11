import type { PracticeFocus, SessionSummary } from '@/types';

const ROUND_PLAN_KEY = 'languini:casePracticeRoundPlan';
const RESULTS_KEY = 'languini:results';

export function setRoundPlan(plan: PracticeFocus[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(ROUND_PLAN_KEY, JSON.stringify(plan));
}

export function consumeRoundPlan(): PracticeFocus[] | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ROUND_PLAN_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(ROUND_PLAN_KEY);
  try {
    return JSON.parse(raw) as PracticeFocus[];
  } catch {
    return null;
  }
}

export interface ResultsNavigationState {
  summary: SessionSummary;
  fromLesson: 'case-practice' | 'vocabulary';
}

export function setResultsState(state: ResultsNavigationState): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RESULTS_KEY, JSON.stringify(state));
}

export function consumeResultsState(): ResultsNavigationState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(RESULTS_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(RESULTS_KEY);
  try {
    return JSON.parse(raw) as ResultsNavigationState;
  } catch {
    return null;
  }
}
