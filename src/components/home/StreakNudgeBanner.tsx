import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { todayLocalISODate } from '../../lib/streakEngine';

const STORAGE_PREFIX = 'cd_streak_nudge_shown_';

/**
 * Gentle reminder once per day if the user has an active streak but has not practiced yet today.
 */
export function StreakNudgeBanner() {
  const { t } = useTranslation();
  const settings = useGameStore(s => s.settings);
  const [dismissed, setDismissed] = useState(false);

  const show = useMemo(() => {
    if (dismissed) return false;
    const today = todayLocalISODate();
    if (settings.streakCurrent <= 0) return false;
    if (settings.lastStreakActivityDate === today) return false;
    try {
      if (localStorage.getItem(STORAGE_PREFIX + today)) return false;
    } catch {
      /* ignore */
    }
    return true;
  }, [settings.streakCurrent, settings.lastStreakActivityDate, dismissed]);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_PREFIX + todayLocalISODate(), '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-amber-700/50 bg-amber-950/35 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-amber-100">
      <p>{t('home.streakNudge', { count: settings.streakCurrent })}</p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-amber-200/90 underline text-xs font-semibold"
      >
        {t('home.dismiss')}
      </button>
    </div>
  );
}
