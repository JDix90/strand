import type { MasteryRecord } from '../types';

/**
 * Shape/glyph-based mastery cues for use on case-colored surfaces (e.g. Learn table).
 * Avoids reusing grammatical-case accent colors so progress reads independently of row theme.
 */
const TABLE: Partial<Record<MasteryRecord['status'], { symbol: string; label: string }>> = {
  introduced: { symbol: '◔', label: 'Introduced' },
  shaky: { symbol: '◑', label: 'Shaky' },
  improving: { symbol: '◕', label: 'Improving' },
  strong: { symbol: '●', label: 'Strong' },
  mastered: { symbol: '★', label: 'Mastered' },
};

/** Legend rows (includes unseen) — all use neutral styling in the UI. */
export const MASTERY_LEGEND_ROWS: { status: MasteryRecord['status']; symbol: string; label: string }[] = [
  { status: 'unseen', symbol: '○', label: 'Unseen' },
  { status: 'introduced', symbol: '◔', label: 'Introduced' },
  { status: 'shaky', symbol: '◑', label: 'Shaky' },
  { status: 'improving', symbol: '◕', label: 'Improving' },
  { status: 'strong', symbol: '●', label: 'Strong' },
  { status: 'mastered', symbol: '★', label: 'Mastered' },
];

export function getMasteryTableIndicator(
  status: MasteryRecord['status'],
): { symbol: string; label: string } | null {
  if (status === 'unseen') return null;
  return TABLE[status] ?? null;
}
