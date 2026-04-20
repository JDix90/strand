import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { useAuth } from '../../contexts/AuthContext';
import { clearAllData } from '../../lib/storage';
import { cloudClearUserProgress } from '../../lib/cloudStorage';
import { CATEGORY_LABELS } from '../../data/allForms';
import type { WordCategory } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { uploadAvatarImage } from '../../lib/profileStorage';

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, updateSettings, toggleCategory } = useGameStore();
  const { profile, loading: authLoading, updateProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [clearingProgress, setClearingProgress] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setEmail(profile.email);
      setBio(profile.bio ?? '');
      setHeadline(profile.headline ?? '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileMessage(null);
    const nextDisplay = displayName.trim();
    const nextEmail = email.trim().toLowerCase();
    const nextBio = bio.trim().slice(0, 500);
    const nextHeadline = headline.trim().slice(0, 120);
    const displayChanged = nextDisplay !== profile.displayName;
    const emailChanged = nextEmail !== profile.email.toLowerCase();
    const bioChanged = nextBio !== (profile.bio ?? '');
    const headlineChanged = nextHeadline !== (profile.headline ?? '');
    if (!displayChanged && !emailChanged && !bioChanged && !headlineChanged) {
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
      ...(bioChanged ? { bio: nextBio || null } : {}),
      ...(headlineChanged ? { headline: nextHeadline || null } : {}),
    });
    setSavingProfile(false);
    if (error) {
      setProfileMessage({ type: 'err', text: error });
    } else {
      setProfileMessage({ type: 'ok', text: info ?? 'Saved.' });
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Clear all progress data? This cannot be undone.')) return;
    setProfileMessage(null);
    setClearingProgress(true);
    try {
      if (profile?.id) {
        const { error } = await cloudClearUserProgress(profile.id);
        if (error) {
          setProfileMessage({
            type: 'err',
            text: `Could not clear server progress: ${error}. Check your connection and try again.`,
          });
          setClearingProgress(false);
          return;
        }
      }
      clearAllData();
      window.location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setProfileMessage({ type: 'err', text: `Clear failed: ${msg}` });
      setClearingProgress(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAvatarFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setProfileMessage(null);
    setAvatarUploading(true);
    const result = await uploadAvatarImage(profile.id, file);
    setAvatarUploading(false);
    e.target.value = '';
    if ('error' in result) {
      setProfileMessage({ type: 'err', text: result.error });
      return;
    }
    const { error } = await updateProfile({ avatarUrl: result.url });
    if (error) setProfileMessage({ type: 'err', text: error });
    else setProfileMessage({ type: 'ok', text: 'Profile photo updated.' });
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

                <div className="flex flex-wrap items-center gap-4">
                  <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                    <button
                      type="button"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-surface-muted hover:bg-surface text-ink text-sm font-semibold disabled:opacity-50"
                    >
                      {avatarUploading ? 'Uploading…' : 'Change photo'}
                    </button>
                    <p className="text-ink-secondary text-xs max-w-xs">
                      Visible to classmates and teachers. JPEG, PNG, WebP, or GIF, up to 2 MB.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="settings-headline" className="text-ink-secondary text-sm font-medium block mb-1.5">
                    Headline <span className="text-ink-secondary/80 font-normal">(optional)</span>
                  </label>
                  <input
                    id="settings-headline"
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Russian instructor"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-strong text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settings-bio" className="text-ink-secondary text-sm font-medium block mb-1.5">
                    About you
                  </label>
                  <textarea
                    id="settings-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="A short bio classmates will see next to your name."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-strong text-ink placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y min-h-[6rem]"
                  />
                  <p className="text-ink-secondary text-xs mt-1">{bio.length}/500</p>
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

        {/* Session goals, streak readout, UI language */}
        <div className="bg-surface rounded-2xl border border-border p-6 space-y-5">
          <h2 className="text-ink font-bold">{t('settings.sessionGoalsTitle')}</h2>
          <p className="text-ink-secondary text-sm leading-relaxed">{t('settings.sessionGoalsHelp')}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sessionGoalType"
                checked={settings.sessionGoalType === 'none'}
                onChange={() => updateSettings({ sessionGoalType: 'none' })}
                className="accent-blue-500"
              />
              <span className="text-ink-secondary">{t('settings.goalNone')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sessionGoalType"
                checked={settings.sessionGoalType === 'time'}
                onChange={() =>
                  updateSettings({
                    sessionGoalType: 'time',
                    sessionGoalMinutes: settings.sessionGoalMinutes ?? 10,
                  })
                }
                className="accent-blue-500"
              />
              <span className="text-ink-secondary">{t('settings.goalTime')}</span>
            </label>
            {settings.sessionGoalType === 'time' && (
              <div className="ml-6 flex flex-wrap items-center gap-2">
                <span className="text-ink-secondary text-sm">{t('settings.minutes')}</span>
                <select
                  value={settings.sessionGoalMinutes ?? 10}
                  onChange={e => updateSettings({ sessionGoalMinutes: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl bg-surface-elevated border border-border-strong text-ink text-sm"
                >
                  {[5, 10, 15, 20, 30].map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sessionGoalType"
                checked={settings.sessionGoalType === 'forms'}
                onChange={() =>
                  updateSettings({
                    sessionGoalType: 'forms',
                    sessionGoalForms: settings.sessionGoalForms ?? 20,
                  })
                }
                className="accent-blue-500"
              />
              <span className="text-ink-secondary">{t('settings.goalForms')}</span>
            </label>
            {settings.sessionGoalType === 'forms' && (
              <div className="ml-6 flex flex-wrap items-center gap-2">
                <span className="text-ink-secondary text-sm">{t('settings.forms')}</span>
                <select
                  value={settings.sessionGoalForms ?? 20}
                  onChange={e => updateSettings({ sessionGoalForms: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl bg-surface-elevated border border-border-strong text-ink text-sm"
                >
                  {[10, 20, 30, 50].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <h3 className="text-ink font-semibold text-sm">{t('settings.streakTitle')}</h3>
            <p className="text-ink-secondary text-sm">{t('settings.streakCurrent', { count: settings.streakCurrent })}</p>
            <p className="text-ink-secondary text-sm">{t('settings.streakBest', { count: settings.streakBest })}</p>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <label htmlFor="ui-locale" className="text-ink font-semibold text-sm block">
              {t('settings.uiLanguage')}
            </label>
            <p className="text-ink-secondary text-xs leading-relaxed">{t('settings.uiLanguageHelp')}</p>
            <select
              id="ui-locale"
              value={settings.uiLocale}
              onChange={e => updateSettings({ uiLocale: e.target.value as 'en' | 'ru' })}
              className="px-3 py-2 rounded-xl bg-surface-elevated border border-border-strong text-ink text-sm"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <div className="rounded-xl border border-border bg-page p-4 space-y-2">
            <p className="text-ink font-semibold text-sm">{t('settings.faqUrlTitle')}</p>
            <p className="text-ink-secondary text-xs leading-relaxed">{t('settings.faqUrlBody')}</p>
          </div>
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
          <p className="text-red-400 text-sm leading-relaxed">
            Erases mastery progress and practice session history on this device and, when you are signed in, on the server so it
            does not come back after refresh.
          </p>
          <button
            type="button"
            onClick={() => void handleClearData()}
            disabled={clearingProgress}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-60 text-ink rounded-xl font-semibold transition-colors"
          >
            {clearingProgress ? 'Clearing…' : 'Clear All Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
