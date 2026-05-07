import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useGameStore } from './store/gameStore';
import { AppShell } from './components/layout/AppShell';
import { reportError } from './lib/observability';

import {
  HomeScreen,
  CasePracticeScreen,
  CasePracticeRunScreen,
  VocabularyScreen,
  ResultsScreen,
} from './lazyScreens';

function RouteFallback() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-ink-secondary text-lg">Loading...</div>
    </div>
  );
}

function AppErrorFallback() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 text-center gap-4">
      <p className="text-lg font-semibold text-ink">Something went wrong</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-ink font-semibold"
      >
        Reload page
      </button>
    </div>
  );
}

function AppInit() {
  const { init } = useGameStore();
  useEffect(() => {
    init();
  }, [init]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="case-practice" element={<CasePracticeScreen />} />
        <Route path="case-practice/run" element={<CasePracticeRunScreen />} />
        <Route path="vocabulary" element={<VocabularyScreen />} />
        <Route path="results" element={<ResultsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <ErrorBoundary
        FallbackComponent={AppErrorFallback}
        onError={(error) => reportError('app_error_boundary', error)}
      >
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
