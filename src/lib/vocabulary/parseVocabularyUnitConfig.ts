export type VocabularyDirection = 'ru-en' | 'en-ru';

export interface VocabularyUnitConfig {
  vocabularySetId: string;
  sessionLength?: number;
  direction?: VocabularyDirection;
}

/** Parse `units.content_config` for vocabulary module. */
export function parseVocabularyUnitConfig(raw: unknown): VocabularyUnitConfig {
  if (!raw || typeof raw !== 'object') {
    return { vocabularySetId: 'food_beverages', sessionLength: 15, direction: 'ru-en' };
  }
  const o = raw as Record<string, unknown>;
  const legacyDeck = typeof o.deckId === 'string' ? o.deckId : undefined;
  const vocabularySetId =
    (typeof o.vocabularySetId === 'string' && o.vocabularySetId) ||
    (legacyDeck === 'food_basic' ? 'food_beverages' : undefined) ||
    'food_beverages';
  const sessionLength =
    typeof o.sessionLength === 'number' && o.sessionLength > 0 && o.sessionLength <= 50
      ? Math.floor(o.sessionLength)
      : 15;
  const direction: VocabularyDirection =
    o.direction === 'en-ru' ? 'en-ru' : 'ru-en';
  return { vocabularySetId, sessionLength, direction };
}
