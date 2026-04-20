import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '../lib/supabase';
import { resetLastActiveThrottle, touchProfileLastActive } from '../lib/lastActive';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile, UserRole, SignUpRole } from '../types';

const ADMIN_EFFECTIVE_KEY = 'cd_admin_effective_role';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** False when env vars are missing or still set to template placeholders */
  supabaseConfigured: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: SignUpRole
  ) => Promise<{ error: string | null; emailConfirmationSent?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Updates `profiles` and/or auth email. Email changes may require confirmation (see `info`). */
  updateProfile: (updates: {
    displayName?: string;
    email?: string;
    bio?: string | null;
    headline?: string | null;
    avatarUrl?: string | null;
  }) => Promise<{ error: string | null; info?: string }>;
  /** When `profile.role === 'admin'`, controls student vs teacher navigation and routes. */
  effectiveRole: 'student' | 'teacher';
  setEffectiveRole: (role: 'student' | 'teacher') => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** When Supabase is not configured, we never fetch a session — stay unauthenticated without a loading spinner. */
  const [loading, setLoading] = useState(() => isSupabaseConfigured);

  const [effectiveRole, setEffectiveRoleState] = useState<'student' | 'teacher'>(() => {
    try {
      const v = localStorage.getItem(ADMIN_EFFECTIVE_KEY);
      if (v === 'teacher' || v === 'student') return v;
    } catch {
      /* ignore */
    }
    return 'student';
  });

  const setEffectiveRole = useCallback((role: 'student' | 'teacher') => {
    try {
      localStorage.setItem(ADMIN_EFFECTIVE_KEY, role);
    } catch {
      /* ignore */
    }
    setEffectiveRoleState(role);
  }, []);

  const loadProfile = useCallback(async (userId: string, email: string) => {
    const trySetFromRow = (row: {
      id: string;
      role: string;
      display_name: string;
      email?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
      headline?: string | null;
    }) => {
      setProfile({
        id: row.id,
        role: row.role as UserRole,
        displayName: row.display_name,
        email: row.email ?? email,
        avatarUrl: row.avatar_url ?? null,
        bio: row.bio ?? null,
        headline: row.headline ?? null,
      });
    };

    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, display_name, email, avatar_url, bio, headline')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return;
    }

    if (data) {
      trySetFromRow(data);
      return;
    }

    // No row: recover auth-only users (e.g. signed up before DB migration or before trigger existed)
    const { data: userData } = await supabase.auth.getUser();
    const u = userData?.user;
    if (!u || u.id !== userId) {
      setProfile(null);
      return;
    }

    const meta = u.user_metadata ?? {};
    const roleRaw = meta.role;
    const role: UserRole =
      roleRaw === 'teacher' || roleRaw === 'student' || roleRaw === 'admin' ? roleRaw : 'student';
    let displayName =
      typeof meta.display_name === 'string' && meta.display_name.trim()
        ? meta.display_name.trim()
        : email.split('@')[0] || 'User';

    const { error: insertErr } = await supabase.from('profiles').insert({
      id: userId,
      role,
      display_name: displayName,
      email,
    });

    if (insertErr) {
      setProfile(null);
      return;
    }

    await supabase.from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id' });

    trySetFromRow({ id: userId, role, display_name: displayName, email });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void touchProfileLastActive(s.user.id);
        loadProfile(s.user.id, s.user.email ?? '').finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED'
        ) {
          void touchProfileLastActive(s.user.id);
        }
        // After sign-in, profile loads async; keep `loading` true until it arrives so
        // RootRoute / RequireAuth don't treat the user as logged-out and bounce to /login.
        if (event === 'SIGNED_IN') {
          setLoading(true);
        }
        void loadProfile(s.user.id, s.user.email ?? '').finally(() => {
          if (event === 'SIGNED_IN') {
            setLoading(false);
          }
        });
      } else {
        resetLastActiveThrottle();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: SignUpRole
    ) => {
    if (!isSupabaseConfigured) return { error: SUPABASE_SETUP_MESSAGE };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
          },
        },
      });
      if (error) return { error: error.message };
      if (!data.user) return { error: 'Sign up failed. Please try again.' };

      // DB trigger `handle_new_user` inserts profiles + user_settings (works with email confirmation).
      if (!data.session) {
        return { error: null, emailConfirmationSent: true };
      }

      await loadProfile(data.user.id, email);
      return { error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          error:
            'Cannot reach Supabase. Check VITE_SUPABASE_URL in .env.local (must be your project URL from the Supabase dashboard), then restart the dev server.',
        };
      }
      return { error: msg || 'Sign up failed.' };
    }
  },
  [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: SUPABASE_SETUP_MESSAGE };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return {
          error:
            'Cannot reach Supabase. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.',
        };
      }
      return { error: msg || 'Sign in failed.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    resetLastActiveThrottle();
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: {
      displayName?: string;
      email?: string;
      bio?: string | null;
      headline?: string | null;
      avatarUrl?: string | null;
    }) => {
      if (!isSupabaseConfigured) return { error: SUPABASE_SETUP_MESSAGE };
      const uid = user?.id;
      if (!uid) return { error: 'Not signed in.' };
      if (
        updates.displayName === undefined &&
        updates.email === undefined &&
        updates.bio === undefined &&
        updates.headline === undefined &&
        updates.avatarUrl === undefined
      ) {
        return { error: null };
      }

      let info: string | undefined;

      try {
        let displayTrimmed: string | undefined;
        if (updates.displayName !== undefined) {
          displayTrimmed = updates.displayName.trim();
          if (!displayTrimmed) return { error: 'Display name cannot be empty.' };
          const { error } = await supabase.from('profiles').update({ display_name: displayTrimmed }).eq('id', uid);
          if (error) return { error: error.message };
          setProfile(prev => (prev ? { ...prev, displayName: displayTrimmed! } : prev));
        }

        if (updates.bio !== undefined) {
          const bio = updates.bio === null ? null : updates.bio.trim().slice(0, 500);
          const { error } = await supabase.from('profiles').update({ bio }).eq('id', uid);
          if (error) return { error: error.message };
          setProfile(prev => (prev ? { ...prev, bio } : prev));
        }
        if (updates.headline !== undefined) {
          const headline = updates.headline === null ? null : updates.headline.trim().slice(0, 120);
          const { error } = await supabase.from('profiles').update({ headline }).eq('id', uid);
          if (error) return { error: error.message };
          setProfile(prev => (prev ? { ...prev, headline } : prev));
        }
        if (updates.avatarUrl !== undefined) {
          const { error } = await supabase.from('profiles').update({ avatar_url: updates.avatarUrl }).eq('id', uid);
          if (error) return { error: error.message };
          setProfile(prev => (prev ? { ...prev, avatarUrl: updates.avatarUrl ?? null } : prev));
        }

        let emailTrimmed: string | undefined;
        if (updates.email !== undefined) {
          emailTrimmed = updates.email.trim().toLowerCase();
          if (!emailTrimmed) return { error: 'Email cannot be empty.' };
        }

        const authOpts: { email?: string; data?: { display_name: string } } = {};
        if (emailTrimmed !== undefined) authOpts.email = emailTrimmed;
        if (displayTrimmed !== undefined) authOpts.data = { display_name: displayTrimmed };

        if (Object.keys(authOpts).length > 0) {
          const { error: authErr } = await supabase.auth.updateUser(authOpts);
          if (authErr) return { error: authErr.message };
          const { data: sessionData } = await supabase.auth.getSession();
          const s = sessionData.session;
          setSession(s);
          setUser(s?.user ?? null);
          if (emailTrimmed !== undefined) {
            const nextMail = s?.user?.email ?? emailTrimmed;
            await supabase.from('profiles').update({ email: nextMail }).eq('id', uid);
            setProfile(prev =>
              prev
                ? {
                    ...prev,
                    email: nextMail,
                  }
                : prev
            );
            info =
              'If your project requires email confirmation, check your inbox to verify the new address.';
          }
        }

        return { error: null, ...(info ? { info } : {}) };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { error: msg || 'Update failed.' };
      }
    },
    [user?.id]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        supabaseConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        updateProfile,
        effectiveRole,
        setEffectiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
