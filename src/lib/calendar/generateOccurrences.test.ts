import { describe, expect, it } from 'vitest';
import { parseISO } from 'date-fns';
import { generateOccurrences, jsWeekdayInTimezone, type ClassCalendarConfig } from './generateOccurrences';

describe('jsWeekdayInTimezone', () => {
  it('returns expected weekday in UTC', () => {
    expect(jsWeekdayInTimezone('2026-04-02', 'UTC')).toBe(4);
  });
});

describe('generateOccurrences', () => {
  const base: ClassCalendarConfig = {
    classId: 'c1',
    className: 'Test',
    timezone: 'UTC',
    level: 'beginner',
    termStartsOn: '2026-04-01',
    termEndsOn: '2026-04-30',
    schedules: [
      {
        id: 's1',
        weekday: 4,
        starts_at: '14:00:00',
        ends_at: '15:30:00',
      },
    ],
  };

  it('emits weekly Thursday between term bounds', () => {
    const from = parseISO('2026-03-28');
    const to = parseISO('2026-04-10');
    const occ = generateOccurrences(base, from, to);
    const dates = occ.map(o => o.date);
    expect(dates).toContain('2026-04-02');
    expect(dates).toContain('2026-04-09');
    expect(dates).not.toContain('2026-03-29');
  });

  it('returns empty without schedules', () => {
    const occ = generateOccurrences({ ...base, schedules: [] }, parseISO('2026-04-01'), parseISO('2026-04-30'));
    expect(occ).toHaveLength(0);
  });
});
