import { lazy } from 'react';

/** Route-level code splitting for phase-1 routes. */

export const HomeScreen = lazy(() =>
  import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen }))
);
export const CasePracticeScreen = lazy(() =>
  import('./screens/CasePracticeScreen').then(m => ({ default: m.CasePracticeScreen }))
);
export const CasePracticeRunScreen = lazy(() =>
  import('./screens/CasePracticeRunScreen').then(m => ({ default: m.CasePracticeRunScreen }))
);
export const VocabularyScreen = lazy(() =>
  import('./screens/VocabularyScreen').then(m => ({ default: m.VocabularyScreen }))
);
export const ResultsScreen = lazy(() =>
  import('./screens/results/ResultsScreen').then(m => ({ default: m.ResultsScreen }))
);
