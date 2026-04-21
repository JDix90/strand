import { describe, expect, it } from 'vitest';
import { buildStudySuggestions } from './suggestions';

describe('buildStudySuggestions', () => {
  it('prioritizes weakest declension unit', () => {
    const s = buildStudySuggestions({
      classId: 'class-1',
      units: [
        {
          unitId: 'u-strong',
          title: 'Strong unit',
          contentModule: 'russian_declension',
          avgMastery: 80,
          weakCount: 0,
          lastSeenAtMs: Date.now(),
        },
        {
          unitId: 'u-weak',
          title: 'Weak unit',
          contentModule: 'russian_declension',
          avgMastery: 30,
          weakCount: 4,
          lastSeenAtMs: Date.now(),
        },
      ],
      sessionsLast14d: 5,
      confusionPairLabels: [],
    });
    const top = s[0];
    expect(top?.action.kind).toBe('class_unit_mode');
    if (top?.action.kind === 'class_unit_mode') {
      expect(top.action.unitId).toBe('u-weak');
    }
  });

  it('uses flat_practice when no class', () => {
    const s = buildStudySuggestions({
      classId: null,
      units: [],
      sessionsLast14d: 0,
      confusionPairLabels: [],
    });
    expect(s.some(x => x.action.kind === 'flat_practice')).toBe(true);
  });
});
