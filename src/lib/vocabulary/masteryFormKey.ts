/** Stable key for vocabulary mastery rows (per unit + lemma + direction). */
export function vocabularyFormKey(
  vocabularySetId: string,
  lemmaId: string,
  direction: 'ru-en' | 'en-ru',
): string {
  return `vocab:${vocabularySetId}:${lemmaId}:${direction}`;
}
