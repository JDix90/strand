import { describe, expect, it } from 'vitest';
import { aggregateCaseAccuracy, averageMasteryScore } from './aggregateMastery';

describe('aggregateCaseAccuracy', () => {
  it('aggregates declension rows by case', () => {
    const rows = [
      {
        form_key: 'ya:nominative',
        unit_id: 'u1',
        content_module: 'russian_declension',
        status: 'strong',
        attempts: 10,
        correct: 8,
        confusion_with: [] as string[],
      },
      {
        form_key: 'ya:genitive',
        unit_id: 'u1',
        content_module: 'russian_declension',
        status: 'shaky',
        attempts: 5,
        correct: 2,
        confusion_with: [] as string[],
      },
    ];
    const s = aggregateCaseAccuracy(rows);
    expect(s.nominative.total).toBe(10);
    expect(s.nominative.correct).toBe(8);
    expect(s.genitive.correct).toBe(2);
  });

  it('skips vocabulary form keys', () => {
    const rows = [
      {
        form_key: 'vocab:set1:lemma:ru-en',
        unit_id: 'u1',
        content_module: 'vocabulary',
        status: 'introduced',
        attempts: 3,
        correct: 1,
        confusion_with: [] as string[],
      },
    ];
    const s = aggregateCaseAccuracy(rows);
    expect(s.nominative.total).toBe(0);
  });
});

describe('averageMasteryScore', () => {
  it('averages mastery_score when present', () => {
    const avg = averageMasteryScore([
      {
        form_key: 'a:b',
        unit_id: 'u',
        status: 'x',
        attempts: 1,
        correct: 1,
        mastery_score: 40,
        confusion_with: [],
      },
      {
        form_key: 'c:d',
        unit_id: 'u',
        status: 'x',
        attempts: 1,
        correct: 1,
        mastery_score: 60,
        confusion_with: [],
      },
    ]);
    expect(avg).toBe(50);
  });
});
