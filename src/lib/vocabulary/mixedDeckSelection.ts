/**
 * Normalize selected vocabulary set ids into a stable, deduped list.
 * Keeps first-seen order while removing empties/duplicates.
 */
export function normalizeDeckSelection(ids: string[] | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Stable dependency key for React effects driven by deck selection content. */
export function deckSelectionKey(ids: string[] | undefined): string {
  return normalizeDeckSelection(ids).join('|');
}
