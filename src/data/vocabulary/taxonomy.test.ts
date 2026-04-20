import { describe, expect, it } from 'vitest';
import { VOCABULARY_SET_IDS } from './taxonomy';
import { VOCABULARY_SET_CHUNK } from '../../lib/vocabulary/deckRegistry';

describe('vocabulary taxonomy', () => {
  it('maps every set id to a lazy chunk', () => {
    for (const id of VOCABULARY_SET_IDS) {
      expect(VOCABULARY_SET_CHUNK[id]).toBeTruthy();
    }
  });

  it('targets ~1000 lemmas across decks (checked by validate:vocab in CI)', () => {
    expect(VOCABULARY_SET_IDS.length).toBe(28);
  });
});
