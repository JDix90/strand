import { useEffect, useState } from 'react';
import {
  registerSyncToastListener,
  dismissSyncToast,
  type SyncToastPayload,
} from '../../lib/syncNotifications';

/**
 * Fixed toast for Supabase sync failures from the game store (mastery, settings, sessions).
 */
export function SyncToastHost() {
  const [payload, setPayload] = useState<SyncToastPayload | null>(null);

  useEffect(() => {
    registerSyncToastListener(setPayload);
    return () => registerSyncToastListener(null);
  }, []);

  if (!payload) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-[100] flex max-w-lg -translate-x-1/2 flex-col gap-2 rounded-xl border border-red-800 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-lg"
    >
      <p className="pr-2">{payload.message}</p>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              try {
                await payload.retry();
              } catch {
                /* toast stays; user can retry again */
              }
            })();
          }}
          className="rounded-lg bg-red-800 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => dismissSyncToast()}
          className="rounded-lg border border-red-700 px-3 py-1.5 text-red-200 hover:bg-red-900/80"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
