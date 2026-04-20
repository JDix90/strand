import { useEffect, useState } from 'react';
import { registerCloudSyncPhaseListener, type CloudSyncPhase } from '../../lib/syncNotifications';

/** Subtle “Saving…” / “Saved” indicator for cloud writes (see `runCloudWriteWithRetry`). */
export function CloudSyncIndicator() {
  const [phase, setPhase] = useState<CloudSyncPhase>('idle');

  useEffect(() => {
    registerCloudSyncPhaseListener(setPhase);
    return () => registerCloudSyncPhaseListener(null);
  }, []);

  if (phase === 'idle') return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[99] pointer-events-none rounded-lg border border-border bg-surface/95 px-3 py-1.5 text-xs text-ink-secondary shadow-md"
      aria-live="polite"
    >
      {phase === 'saving' ? 'Saving…' : 'Saved'}
    </div>
  );
}
