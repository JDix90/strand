/**
 * Strip combining acute accent (U+0301) used for Russian stress in pedagogy.
 * Some Web Speech engines mispronounce when stress marks are present; TTS uses the stripped form only.
 */
export function stripCombiningStressForTts(text: string): string {
  return text.replace(/\u0301/g, '');
}
