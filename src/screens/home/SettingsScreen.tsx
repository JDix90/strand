import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useAuth } from '../../contexts/AuthContext';
import { clearAllData } from '../../lib/storage';
import { CATEGORY_LABELS } from '../../data/allForms';
import type { WordCategory } from '../../types';

export function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, updateSettings, toggleCategory } = useGameStore();
  const { profile, loading: authLoading, updateProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileMessage(null);
    const nextDisplay = displayName.trim();
    const nextEmail = email.trim().toLowerCase();
    const displayChanged = nextDisplay !== profile.displayName;
    const emailChanged = nextEmail !== profile.email.toLowerCase();
    if (!displayChanged && !emailChanged) {
      setProfileMessage({ type: 'ok', text: 'No changes to save.' });
      return;
    }
    if (!nextDisplay) {
      setProfileMessage({ type: 'err', text: 'Display name cannot be empty.' });
      return;
    }
    setSavingProfile(true);
    const { error, info } = await updateProfile({
      ...(displayChanged ? { displayName: nextDisplay } : {}),
      ...(emailChanged ? { email: nextEmail } : {}),
    });
    setSavingProfile(false);
    if (error) {
      setProfileMessage({ type: 'err', text: error });
    } else {
      setProfileMessage({ type: 'ok', text: info ?? 'Saved.' });
    }
  };

  const handleClearData = () => {
    if (window.confirm('Clear all progress data? This cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink">Settings</h1>
            <p className="text-ink-secondary text-sm mt-0.5">Game preferences and account</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-ink font-bold">Profile</h2>
          {authLoading && !profile ? (
            <p className="text-ink-secondary text-sm">Loading account…</p>
          ) : profile ? (
            <>
              <div className="space-y-4">
                <div>
                  <label htmlFor="settings-display-name" className="text-ink-secondary text-sm font-medium block mb-1.5">
                    Display name
                  </label>
                  <input
                    id="settings-display-name"
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    autoComplete="name"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-strong text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="text-ink-secondary text-sm font-medium block mb-1.5">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-strong text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                  <p className="text-ink-secondary text-xs mt-1.5 leading-relaxed">
                    Changing email may send a confirmation link, depending on your Supabase auth settings.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-ink-secondary text-sm font-medium">Role</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-surface-muted text-ink text-sm capitalize border border-border-strong">
                    {profile.role}
                  </span>
                  {profile.role === 'admin' ? (
                    <span className="text-ink-secondary text-xs">Use the admin bar at the top to switch Student / Teacher view.</span>
                  ) : (
                    <span className="text-ink-secondary text-xs">(contact an admin to change)</span>
                  )}
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    profileMessage.type === 'ok'
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-200'
                      : 'bg-red-950 border border-red-800 text-red-300'
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-ink rounded-xl font-semibold transition-colors"
                >
                  {savingProfile ? 'Saving…' : 'Save profile'}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-5 py-2.5 bg-surface-muted hover:bg-surface-muted text-ink rounded-xl font-semibold transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <p className="text-ink-secondary text-sm">Could not load profile. Try signing in again.</p>
          )}
        </div>

        {/* Difficulty */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-ink font-bold">Default Difficulty</h2>
          <div className="flex gap-3">
            {(['beginner', 'standard', 'advanced'] as const).map(d => (
              <button
                key={d}
                onClick={() => updateSettings({ difficulty: d })}
                className={`flex-1 py-2 rounded-xl font-semibold capitalize transition-colors ${
                  settings.difficulty === d
                    ? 'bg-brand text-white border-2 border-blue-400'
                    : 'bg-surface-muted text-ink-secondary border-2 border-border-strong hover:border-border-strong'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Display Options */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-ink font-bold">Display Options</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-ink-secondary">Show helper words</span>
            <input
              type="checkbox"
              checked={settings.showHelperWords}
              onChange={e => updateSettings({ showHelperWords: e.target.checked })}
              className="w-5 h-5 accent-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-ink-secondary">Show English gloss</span>
            <input
              type="checkbox"
              checked={settings.showEnglishGloss}
              onChange={e => updateSettings({ showEnglishGloss: e.target.checked })}
              className="w-5 h-5 accent-blue-500"
            />
          </label>
        </div>

        {/* Active Categories */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-ink font-bold">Active Word Categories</h2>
          <p className="text-ink-secondary text-sm">Choose which word types appear in Practice, Speed, and Boss modes.</p>
          <div className="space-y-3">
            {(['pronoun', 'name', 'noun'] as WordCategory[]).map(cat => {
              const info = CATEGORY_LABELS[cat];
              const active = settings.activeCategories.includes(cat);
              return (
                <label key={cat} className="flex items-center justify-between cursor-pointer">
                  <span className="text-ink-secondary flex items-center gap-2">
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleCategory(cat)}
                    className="w-5 h-5 accent-blue-500"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950 rounded-2xl border border-red-800 p-6 space-y-3">
          <h2 className="text-red-300 font-bold">Danger Zone</h2>
          <p className="text-red-400 text-sm">This will erase all mastery data and session history.</p>
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-ink rounded-xl font-semibold transition-colors"
          >
            Clear All Progress
          </button>
        </div>
      </div>
    </div>
  );
}
