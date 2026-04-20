import type { VocabEntry, VocabPos } from './types';

/**
 * Compact deck lines: `lemmaId|Russian|English|pos` where pos is n|v|a|o (default n).
 * Pipe in Russian/English is not supported — use rare glosses without `|`.
 */
export function parseCompactDeck(vocabularySetId: string, raw: string): VocabEntry[] {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));
  const out: VocabEntry[] = [];
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) continue;
    const [lemmaId, ru, en, posRaw] = parts;
    const pos: VocabPos =
      posRaw === 'v' ? 'verb' : posRaw === 'a' ? 'adj' : posRaw === 'o' ? 'other' : 'noun';
    out.push({ lemmaId, ru, en, pos, vocabularySetId });
  }
  return out;
}
