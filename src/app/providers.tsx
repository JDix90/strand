'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useGameStore } from '@/store/gameStore';
import { reportError } from '@/lib/observability';

function AppInit() {
  const { init } = useGameStore();
  useEffect(() => {
    init();
  }, [init]);
  return null;
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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppInit />
      <ErrorBoundary FallbackComponent={AppErrorFallback} onError={(error) => reportError('app_error_boundary', error)}>
        {children}
      </ErrorBoundary>
    </>
  );
}
