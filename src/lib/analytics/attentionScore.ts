/**
 * Higher score = student likely needs more support (0–100).
 * Heuristic: blends weak mastery, low recent session volume, and stale activity.
 */
export function computeAttentionScoreV1(opts: {
  avgMastery: number | null;
  sessionsLast30d: number;
  daysSinceLastActivity: number | null;
}): number {
  const { avgMastery, sessionsLast30d, daysSinceLastActivity } = opts;

  const masteryPart =
    avgMastery == null ? 40 : Math.max(0, Math.min(55, Math.round((100 - avgMastery) * 0.55)));

  const sessionPart = Math.max(0, Math.min(35, Math.round((10 - Math.min(sessionsLast30d, 10)) * 3.5)));

  let stalePart = 0;
  if (daysSinceLastActivity != null && daysSinceLastActivity > 3) {
    stalePart = Math.min(25, Math.round((daysSinceLastActivity - 3) * 2.2));
  }

  return Math.min(100, masteryPart + sessionPart + stalePart);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 0) {
    return (s[mid - 1]! + s[mid]!) / 2;
  }
  return s[mid]!;
}
