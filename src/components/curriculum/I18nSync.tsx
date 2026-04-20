import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

/** Keeps i18next language in sync with `settings.uiLocale`. */
export function I18nSync() {
  const uiLocale = useGameStore(s => s.settings.uiLocale);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (uiLocale && i18n.language !== uiLocale) {
      void i18n.changeLanguage(uiLocale);
    }
  }, [uiLocale, i18n]);

  return null;
}
