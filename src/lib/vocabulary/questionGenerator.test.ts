import { describe, expect, it } from 'vitest';
import type { VocabEntry } from '../../data/vocabulary/types';
import { buildVocabularySession, pickDistractorEn } from './questionGenerator';

const pool: VocabEntry[] = [
  { lemmaId: 'a1', ru: 'молоко', en: 'milk', pos: 'noun', vocabularySetId: 'food_beverages' },
  { lemmaId: 'a2', ru: 'вода', en: 'water', pos: 'noun', vocabularySetId: 'food_beverages' },
  { lemmaId: 'a3', ru: 'чай', en: 'tea', pos: 'noun', vocabularySetId: 'food_beverages' },
  { lemmaId: 'a4', ru: 'кофе', en: 'coffee', pos: 'noun', vocabularySetId: 'food_beverages' },
  { lemmaId: 'b1', ru: 'стол', en: 'table', pos: 'noun', vocabularySetId: 'home_furniture' },
];

describe('pickDistractorEn', () => {
  it('never includes the target gloss', () => {
    const target = pool[0]!;
    const d = pickDistractorEn(target, pool, 3);
    expect(d).toHaveLength(3);
    expect(d.every(x => x.toLowerCase() !== target.en.toLowerCase())).toBe(true);
  });
});

describe('buildVocabularySession', () => {
  it('builds ru-en questions with four choices including the correct answer', () => {
    const qs = buildVocabularySession(pool, 4, 'ru-en');
    expect(qs).toHaveLength(4);
    for (const q of qs) {
      expect(q.choices).toHaveLength(4);
      expect(q.choices).toContain(q.correctAnswer);
    }
  });

  it('sets prompt parts and Russian TTS for ru-en', () => {
    const qs = buildVocabularySession(pool, 1, 'ru-en');
    expect(qs).toHaveLength(1);
    const q = qs[0]!;
    expect(q.promptPrefix).toBe('Translate:');
    expect(q.promptTarget).toBeTruthy();
    expect(q.prompt).toBe(`Translate: ${q.promptTarget}`);
    expect(q.speakLang).toBe('ru');
  });

  it('sets prompt parts and English TTS for en-ru', () => {
    const qs = buildVocabularySession(pool, 1, 'en-ru');
    expect(qs).toHaveLength(1);
    const q = qs[0]!;
    expect(q.promptPrefix).toBe('Translate:');
    expect(q.promptTarget).toBeTruthy();
    expect(q.prompt).toBe(`Translate: ${q.promptTarget}`);
    expect(q.speakLang).toBe('en');
  });
});
