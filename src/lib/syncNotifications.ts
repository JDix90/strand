/** Decouples game store from React so cloud save failures can show a toast without circular imports. */

export interface SyncToastPayload {
  message: string;
  /** Re-run the same Supabase write; should throw on failure. */
  retry: () => Promise<void>;
}

type Listener = (payload: SyncToastPayload | null) => void;

let listener: Listener | null = null;

export function registerSyncToastListener(fn: Listener | null): void {
  listener = fn;
}

export function dismissSyncToast(): void {
  listener?.(null);
}

export function notifySyncFailure(message: string, retry: () => Promise<void>): void {
  listener?.({ message, retry });
}

/**
 * One automatic retry, then surfaces toast with manual Retry (per UX plan).
 * Use for idempotent upserts (mastery, settings, session insert).
 */
export async function runCloudWriteWithRetry(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch {
    try {
      await fn();
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      notifySyncFailure(`Could not save ${label}: ${msg}`, async () => {
        await fn();
        dismissSyncToast();
      });
    }
  }
}
