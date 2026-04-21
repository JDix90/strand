import { describe, expect, it } from 'vitest';
import { computeAttentionScoreV1, median } from './attentionScore';

describe('median', () => {
  it('returns middle value', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('computeAttentionScoreV1', () => {
  it('increases with weak mastery and few sessions', () => {
    const high = computeAttentionScoreV1({
      avgMastery: 20,
      sessionsLast30d: 0,
      daysSinceLastActivity: 14,
    });
    const low = computeAttentionScoreV1({
      avgMastery: 90,
      sessionsLast30d: 10,
      daysSinceLastActivity: 1,
    });
    expect(high).toBeGreaterThan(low);
  });
});
