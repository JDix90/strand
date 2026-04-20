import { supabase } from './supabase';

/** Avoid writing on every TOKEN_REFRESHED (~hourly); still updates a few times per long session. */
const THROTTLE_MS = 10 * 60 * 1000;

let lastPingAt = 0;
let lastUserId: string | null = null;

/**
 * Persists `profiles.last_active_at` for the signed-in user. Throttled per user so token
 * refresh does not spam the database.
 */
export async function touchProfileLastActive(userId: string): Promise<void> {
  const now = Date.now();
  if (lastUserId === userId && now - lastPingAt < THROTTLE_MS) return;
  lastUserId = userId;
  lastPingAt = now;

  const { error } = await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.warn('touchProfileLastActive:', error.message);
  }
}

/** Call when signing out so the next user’s first ping is not throttled by the previous session. */
export function resetLastActiveThrottle(): void {
  lastPingAt = 0;
  lastUserId = null;
}
