export interface SessionRowLite {
  user_id: string;
  completed_at: string;
  total_questions?: number | null;
  accuracy?: number | null;
}

/** ISO week key Monday-based: YYYY-Www */
export function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function bucketSessionsByWeek(
  sessions: SessionRowLite[],
  sinceMs: number,
): { week: string; count: number; questions: number; avgAccuracy: number | null }[] {
  const map = new Map<string, { count: number; questions: number; accSum: number; accN: number }>();
  for (const s of sessions) {
    const t = new Date(s.completed_at).getTime();
    if (t < sinceMs) continue;
    const wk = isoWeekKey(new Date(s.completed_at));
    const cur = map.get(wk) ?? { count: 0, questions: 0, accSum: 0, accN: 0 };
    cur.count += 1;
    cur.questions += s.total_questions ?? 0;
    if (typeof s.accuracy === 'number' && !Number.isNaN(s.accuracy)) {
      cur.accSum += s.accuracy;
      cur.accN += 1;
    }
    map.set(wk, cur);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, v]) => ({
      week,
      count: v.count,
      questions: v.questions,
      avgAccuracy: v.accN > 0 ? v.accSum / v.accN : null,
    }));
}
