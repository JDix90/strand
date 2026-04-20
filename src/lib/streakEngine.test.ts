import { describe, it, expect } from 'vitest';
import { nextStreakState, localCalendarDateFromISO } from './streakEngine';

describe('nextStreakState', () => {
  it('first session ever starts streak at 1', () => {
    const r = nextStreakState(null, '2026-04-10', 0, 0);
    expect(r.current).toBe(1);
    expect(r.best).toBe(1);
    expect(r.lastActivityDate).toBe('2026-04-10');
  });

  it('second session same day does not increment streak', () => {
    const r = nextStreakState('2026-04-10', '2026-04-10', 3, 5);
    expect(r.current).toBe(3);
    expect(r.best).toBe(5);
  });

  it('next day increments streak', () => {
    const r = nextStreakState('2026-04-09', '2026-04-10', 2, 2);
    expect(r.current).toBe(3);
    expect(r.best).toBe(3);
  });

  it('gap of more than one day resets streak to 1', () => {
    const r = nextStreakState('2026-04-07', '2026-04-10', 5, 5);
    expect(r.current).toBe(1);
    expect(r.best).toBe(5);
  });
});

describe('localCalendarDateFromISO', () => {
  it('returns local date string', () => {
    const s = localCalendarDateFromISO(new Date(2026, 3, 2, 15, 0, 0).toISOString());
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
