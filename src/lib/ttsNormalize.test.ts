import { describe, expect, it } from 'vitest';
import { stripCombiningStressForTts } from './ttsNormalize';

describe('stripCombiningStressForTts', () => {
  it('removes combining acute used for stress', () => {
    expect(stripCombiningStressForTts('молоко\u0301')).toBe('молоко');
  });

  it('leaves text without combining marks unchanged', () => {
    expect(stripCombiningStressForTts('коктейль')).toBe('коктейль');
  });
});
