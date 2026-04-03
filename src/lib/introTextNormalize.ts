/** Normalize user Cyrillic input for comparison. */
export function normalizeIntroAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
