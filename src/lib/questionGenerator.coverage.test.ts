import { describe, expect, it } from 'vitest';
import { generateQuestion } from './questionGenerator';
import { caseOrder } from '../data/caseMetadata';
import type { WordCategory } from '../types';

const categories: WordCategory[] = ['pronoun', 'name', 'noun'];

describe('questionGenerator focused drill coverage', () => {
  it('returns non-null questions with enough variation for every cell', () => {
    for (const category of categories) {
      for (const caseId of caseOrder) {
        const answers = new Set<string>();
        for (let i = 0; i < 30; i += 1) {
          const question = generateQuestion('practice', 'standard', [caseId], [], undefined, [category]);
          expect(question).not.toBeNull();
          if (!question) continue;
          answers.add(question.template.correctAnswer);
          expect(question.template.targetCaseId).toBe(caseId);
        }
        expect(answers.size).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('supports post-preposition forms for pronoun targets', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i += 1) {
      const q = generateQuestion('practice', 'standard', ['genitive'], [], 'ona:genitive', ['pronoun']);
      expect(q).not.toBeNull();
      if (!q) continue;
      seen.add(q.template.correctAnswer);
    }
    expect(seen.has('её') || seen.has('ее')).toBe(true);
    expect(seen.has('неё') || seen.has('нее')).toBe(true);
  });

  it('caps repeated lemma usage to at most twice in an 8-question focused round', () => {
    for (let run = 0; run < 40; run += 1) {
      const usedIds: string[] = [];
      const lemmaCounts = new Map<string, number>();
      for (let i = 0; i < 8; i += 1) {
        const q = generateQuestion('practice', 'standard', ['accusative'], usedIds, undefined, ['pronoun']);
        expect(q).not.toBeNull();
        if (!q) continue;
        usedIds.push(q.template.id);
        const lemmaId = q.template.targetLemmaId;
        expect(lemmaId).toBeTruthy();
        if (!lemmaId) continue;
        lemmaCounts.set(lemmaId, (lemmaCounts.get(lemmaId) ?? 0) + 1);
      }
      for (const count of lemmaCounts.values()) {
        expect(count).toBeLessThanOrEqual(2);
      }
    }
  });
});
