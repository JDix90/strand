import { addDays, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

export interface ScheduleRow {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
}

export interface ClassCalendarConfig {
  classId: string;
  className: string;
  timezone: string;
  level: string | null;
  termStartsOn: string | null;
  termEndsOn: string | null;
  schedules: ScheduleRow[];
}

export interface Occurrence {
  classId: string;
  className: string;
  level: string | null;
  date: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  scheduleId: string;
}

/** JS weekday 0=Sun..6=Sat for a civil date interpreted in `timeZone`. */
export function jsWeekdayInTimezone(isoDate: string, timeZone: string): number {
  const d = new Date(`${isoDate}T12:00:00`);
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(d);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const key = short.slice(0, 3);
  return map[key] ?? 0;
}

function clipRange(
  rangeStart: Date,
  rangeEnd: Date,
  termStart: string | null,
  termEnd: string | null,
): { start: Date; end: Date } {
  let start = startOfDay(rangeStart);
  let end = startOfDay(rangeEnd);
  if (termStart) {
    const t = startOfDay(parseISO(termStart));
    if (isAfter(t, start)) start = t;
  }
  if (termEnd) {
    const t = startOfDay(parseISO(termEnd));
    if (isBefore(t, end)) end = t;
  }
  if (isAfter(start, end)) {
    return { start: rangeStart, end: rangeStart };
  }
  return { start, end };
}

function formatWallTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return format(d, 'h:mm a');
}

/**
 * Enumerate class meeting occurrences between rangeStart and rangeEnd (inclusive, local calendar dates).
 */
export function generateOccurrences(
  cfg: ClassCalendarConfig,
  rangeStart: Date,
  rangeEnd: Date,
): Occurrence[] {
  if (cfg.schedules.length === 0) return [];
  const { start, end } = clipRange(rangeStart, rangeEnd, cfg.termStartsOn, cfg.termEndsOn);
  const out: Occurrence[] = [];
  for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
    const iso = format(d, 'yyyy-MM-dd');
    const dow = jsWeekdayInTimezone(iso, cfg.timezone);
    for (const s of cfg.schedules) {
      if (s.weekday !== dow) continue;
      out.push({
        classId: cfg.classId,
        className: cfg.className,
        level: cfg.level,
        date: iso,
        startsAt: formatWallTime(s.starts_at),
        endsAt: formatWallTime(s.ends_at),
        timezone: cfg.timezone,
        scheduleId: s.id,
      });
    }
  }
  return out;
}
